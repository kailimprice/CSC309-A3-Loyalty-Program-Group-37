// All users:
//View: all users with filter, pages/infinite scroll
//Filter by name, role. verified, activated, page, limit
//Functionality: manage users
//Need to be able to verify users, make cashier suspicious/not, promote/demote

// Admin:
//View all users?
//Functionality: can promote/demote users

import Typography from '@mui/joy/Typography';
import Table from '../../components/Table/Table.jsx'
import {useState, useEffect} from 'react'
import FilterListIcon from '@mui/icons-material/FilterList';
import {Box, Stack, Button, TextField, Radio, RadioGroup, FormControlLabel} from '@mui/material';
import DialogGeneral from '../../components/DialogGeneral/DialogGeneral.jsx';
import {useUserContext} from '../../contexts/UserContext';
import {fetchServer} from "../../utils/utils";
import NotFound from "../NotFound/NotFound.jsx"
import {useSearchParams, useLocation} from 'react-router-dom';

const resultsPerPage = 10;

export default function Users() {
    const [filterOpen, setFilterOpen] = useState(false);
    const [selection, setSelection] = useState(undefined);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const [pageSize, setPageSize] = useState(0);
    const {user} = useUserContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const location = useLocation();

    // Fetch all users
    async function getUsers(token) {
        let params = location.search;
        let [response, error] = await fetchServer(`users${params}`, {
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
            results[i].role = results[i].role[0].toUpperCase() + results[i].role.slice(1);
        }
        setPage(count > 0 ? 1 : 0);
        setNumPages(Math.ceil(count / resultsPerPage));
        setData(results);
    }
    useEffect(() => {
        if (!token)
            return;
        getUsers(token);
    }, [location.search]);
    if (!token)
        return <NotFound/>
    
    // In-page changes
    async function changeProperty(id, field, value, transform) {
        transform = transform ? transform : x => x;
        const json = {};
        json[field] = transform(value);

        // Change server
        let [response, error] = await fetchServer(`users/${id}`, {
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
                    newData[i][field] = value;
                    break;
                }
            }
            setData(newData);
        } else {
            console.log("WTF");
        }
    }
    function changeRole(id, role) {
        if (data.find(x => x.id == id).role == role)
            return;
        changeProperty(id, 'role', role, x => x.toLowerCase());
    }
    function changeVerified(id, verified) {
        if (verified == 'Yes')
            return;
        changeProperty(id, 'verified', true);
    }
    function changeSuspicious(id, suspicious) {
        changeProperty(id, 'suspicious', suspicious == 'Yes' ? false : true);
    }

    // Initialize editable columns based on user role
    const roles = ['Superuser', 'Manager', 'Cashier', 'Regular'];
    const rolesSettable = user.role == 'superuser' ? roles : ['Cashier', 'Regular']; 
    const columns = {
        id: ['ID', 'number'],
        utorid: ['UTORid', 'string'],
        name: ['Name', 'string'],
        birthday: ['Birthday', 'date'],
        role: ['Role', roles, rolesSettable, changeRole, true],
        points: ['Points', 'number'],
        createdAt: ['Created', 'date'],
        lastLogin: ['Last Login', 'date'],
        verified: ['Verified', 'boolean', null, changeVerified, true],
        suspicious: ['Suspicious', 'boolean', null, changeSuspicious, true]
    };

    // Filter
    const filterFields = {
        utorid: ['UTORid', 'text'],
        name: ['Name', 'text'],
        role: ['Role', 'text'],
        verified: ['Verified', 'boolean'],
        activated: ['Activated', 'boolean']
    };
    function FilterBody({fields}) {
        const rows = [];
        for (let name in fields) {
            const [display, type] = fields[name];
            rows.push(<>
                <Typography>{display}</Typography>
                {type == 'text' &&
                <TextField fullWidth variant="outlined" margin='dense' slotProps={{htmlInput: {style: {padding: '5px 10px'}}}}
                            id={name} name={name} type={type}/>}
                {type == 'boolean' &&
                <RadioGroup row sx={{justifyContent: 'center'}}>
                    <FormControlLabel name={name} value={false} control={<Radio/>} label="No"/>
                    <FormControlLabel name={name} value={true} control={<Radio/>} label="Yes"/>
                </RadioGroup>}
            </>);
        }
        return <Box style={{display: 'grid', gridTemplateColumns: 'auto auto', alignItems: 'center'}}>
            {rows}
        </Box>;
    }
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
            Users
        </Typography>

        <DialogGeneral title='Filter' submitTitle='Apply' open={filterOpen} setOpen={setFilterOpen}
                        dialogStyle={{width: '400px'}}
                        submitFunc={applyFilter}>
            <FilterBody fields={filterFields}/>
        </DialogGeneral>
        
        <Table columns={columns} data={data} selection={selection} setSelection={setSelection}
                page={page} numPages={numPages} buttons={buttons}/>
    </>
}