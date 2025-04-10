/*
/events (regular+)
- filter: name, location, started, ended, showFull, published (manager+)
*/

import Typography from '@mui/joy/Typography';
import Table from '../../components/Table/Table.jsx'
import {useState, useEffect} from 'react'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import {Stack, Button, Dialog} from '@mui/material';
import {DialogGeneral, FilterBody} from '../../components/DialogGeneral/DialogGeneral.jsx';
import {useUserContext} from '../../contexts/UserContext';
import {fetchServer, hasPerms} from "../../utils/utils";
import NotFound from "../NotFound/NotFound.jsx"
import {useSearchParams, useLocation, useNavigate} from 'react-router-dom';

const resultsPerPage = 10;

export default function Events() {
    const [selection, setSelection] = useState(undefined);
    const [filterOpen, setFilterOpen] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const {user, viewAs, updateDisplay} = useUserContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const location = useLocation();

    // Fetch all events
    async function getEvents(token) {
        let params = location.search;
        if (viewAs != user.role)
            params = `${params}${params.length == 0 ? '?' : '&'}viewAsRole=${viewAs}`;
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
    }, [location.search, updateDisplay, viewAs]);
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
                    break;
                }
            }
            setData(newData);
        } else {
            console.log("WTF");
        }
    }
    function changePublished(id, published) {
        if (published == 'Yes')
            return;
        changeProperty(id, `events/${id}`, 'published', true);
    }

    const columns = {
        id: ['ID', 'number'],
        name: ['Name', 'string'],
        location: ['Location', 'string'],
        startTime: ['Start Time', 'date'],
        endTime: ['End Time', 'date'],
        numGuests: ['Guests', 'number'],
        capacity: ['Capacity', 'number']
    };
    if (hasPerms(viewAs, 'manager')) {
        columns.pointsRemain = ['Points Remaining', 'number'];
        columns.pointsAwarded = ['Points Awarded', 'number'];
        columns.published = ['Published', 'boolean', null, changePublished, true];
    }
    
    // Filter
    const filterFields = {
        name: ['Name', 'text'],
        location: ['Location', 'text'],
        started: ['Event Started', 'boolean'],
        ended: ['Event Ended', 'boolean'],
        showFull: ['Event is Full', 'boolean']
    };
    if (hasPerms(viewAs, 'manager')) {
        filterFields.published = ['Published', 'boolean'];
    }
    async function applyFilter(json) {
        for (let key in json) {
            if (json[key] == '')
                delete json[key];
        }
        setSearchParams(json);
    }

    // Buttons in table header
    const [deleteDialogOpen, setDialogDeleteOpen] = useState(false);
    const [deleteDialogText, setDeleteDialogText] = useState('');
    async function deleteRow() {
        if (!selection)
            return;
        let [result, error] = await fetchServer(`events/${selection}`, {
            method: 'DELETE',
            headers: new Headers({'Authorization': `Bearer ${token}`})
        });
        if (error) {
            setDialogDeleteOpen(true);
            setDeleteDialogText(error);
            return;
        }
        setData(data.filter(x => x.id != selection));
    }
    const ErrorDialog = <DialogGeneral title='Failed to Delete'
                                    children={<Typography>{deleteDialogText}</Typography>}
                                    open={!!deleteDialogOpen} setOpen={setDialogDeleteOpen}
                                    submitTitle={'Okay'} submitFunc={async () => {return}}/>
    const navigate = useNavigate();
    const buttons = <Stack direction='row' spacing={1} sx={{margin: '5px 0px'}}>
        <Button sx={{textTransform: 'none'}} variant='outlined' size='small' disabled={!selection}
                startIcon={<FormatListBulletedIcon/>} onClick={() => navigate(`./${selection}`)}> 
            View
        </Button>
        {hasPerms(viewAs, 'manager') &&
        <>
            {ErrorDialog}
            <Button sx={{textTransform: 'none'}} variant='outlined' size='small' disabled={!selection}
                startIcon={<DeleteIcon/>} onClick={() => deleteRow()}> 
                Delete
            </Button>
        </>}
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
        
        <Table columns={columns} data={data} page={page} numPages={numPages} buttons={buttons} selection={selection} setSelection={setSelection}/>
    </>
}