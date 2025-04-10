/*
/events (regular+)
- filter: name, location, started, ended, showFull, published (manager+)
*/

import Typography from '@mui/joy/Typography';
import Table from '../../components/Table/Table.jsx'
import {useState, useEffect} from 'react'
import FilterListIcon from '@mui/icons-material/FilterList';
import {Stack, Button} from '@mui/material';
import {DialogGeneral, FilterBody} from '../../components/DialogGeneral/DialogGeneral.jsx';
import {useUserContext} from '../../contexts/UserContext';
import {fetchServer, hasPerms} from "../../utils/utils";
import NotFound from "../NotFound/NotFound.jsx"
import {useSearchParams, useLocation} from 'react-router-dom';

const resultsPerPage = 10;

export default function Events() {
    const [filterOpen, setFilterOpen] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const {viewAs, updateDisplay} = useUserContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const location = useLocation();

    // Fetch all events
    async function getEvents(token) {
        let params = location.search;
        let [response, error] = await fetchServer(`events${params}`, {
            method: 'GET',
            headers: new Headers({'Authorization': `Bearer ${token}`})
        });
        if (error) {
            setPage(0);
            setNumPages(0);
            setData([]);
            return console.log(error);
        }
        response = await response.json();
        console.log(response);
        const {results, count} = response;
        for (let i = 0; i < results.length; i++) {
            results[i].numGuests = results[i].guests.length;
        }
        if (count == 0)
            setPage(0);
        else if (!searchParams.get('page'))
            setPage(1);
        else
            setPage(parseInt(searchParams.get('page'), 10));
        setNumPages(Math.ceil(count / resultsPerPage));
        setData(results);
    }
    useEffect(() => {
        if (!token)
            return;
        getEvents(token);
    }, [location.search, updateDisplay]);
    if (!token)
        return <NotFound/>
    
    // In-page changes
    async function changeProperty(id, path, key, value, transform) {
        transform = transform ? transform : x => x;
        const json = {};
        json[key] = transform(value);

        // Change server
        let [response, error] = await fetchServer(path, {
            method: 'PATCH',
            headers: new Headers({
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify(json)
        });
        if (error)
            return console.log(error);

        // Change state
        if (await response.json()) {
            const newData = Array.from(data);
            for (let i = 0; i < newData.length; i++) {
                if (newData[i].id == id) {
                    newData[i][key] = value;
                    
                    // Special case for role
                    if (key == 'role') {
                        if (value == 'Cashier') {
                            newData[i].suspicious = false;
                        } else {
                            newData[i].suspicious = null;
                        }
                    }
                    break;
                }
            }
            setData(newData);
        } else {
            console.log("WTF");
        }
    }
    function changePublished(id, published) {
        changeProperty(id, `/events/${id}`, published == 'Yes' ? false : true);
    }

    const columns = {
        id: ['ID', 'number'],
        name: ['Name', 'string'],
        location: ['Location', 'string'],
        startTime: ['Start Time', 'date'],
        endTime: ['End Time', 'date'],
        capacity: ['Capacity', 'number'],
        numGuests: ['Guests', 'number']
    };
    if (hasPerms(viewAs, 'manager')) {
        columns.pointsRemain = ['Points Remaining', 'number'];
        columns.pointsAwarded = ['Points Awarded', 'number'];
        columns.published = ['Published', 'boolean', null, changePublished, true];
    }
    
    // Filter
    const filterFields = {
        utorid: ['UTORid', 'text'],
        name: ['Name', 'text'],
        role: ['Role', 'text'],
        verified: ['Verified', 'boolean'],
        activated: ['Account Activated', 'boolean']
    };
    async function applyFilter(json) {
        for (let key in json) {
            if (json[key] == '')
                delete json[key];
        }
        setSearchParams(json);
    }

    // Buttons in table header
    const buttons = <Stack direction='row' spacing={1} sx={{margin: '5px 0px'}}>
        <Button sx={{textTransform: 'none'}} variant='outlined' size='small'
                startIcon={<FilterListIcon/>} onClick={() => setFilterOpen(true)}> 
            Filter
        </Button>
    </Stack>

    return <>
        <Typography variant='h3' sx={{marginBottom: '5px'}}>
            Events
        </Typography>

        <DialogGeneral title='Filter' submitTitle='Apply' open={filterOpen} setOpen={setFilterOpen}
                        dialogStyle={{width: '400px'}}
                        submitFunc={applyFilter}>
            <FilterBody fields={filterFields}/>
        </DialogGeneral>
        
        <Table columns={columns} data={data} page={page} numPages={numPages} buttons={buttons}/>
    </>
}