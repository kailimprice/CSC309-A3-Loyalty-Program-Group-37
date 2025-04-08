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
import {Stack, Button} from '@mui/material';
import DialogGeneral from '../../components/DialogGeneral/DialogGeneral.jsx';
import {useUserContext} from '../../contexts/UserContext';
import {fetchServer} from "../../utils/utils";
import NotFound from "../NotFound/NotFound.jsx"

const columns = {
    id: ['ID', 'number'],
    utorid: ['UTORid', 'string'],
    birthday: ['Birthday', 'date'],
    role: ['Role', ['Superuser', 'Manager', 'Cashier', 'Regular']],
    points: ['Points', 'number'],
    createdAt: ['Created', 'date'],
    lastLogin: ['Last Login', 'date'],
    verified: ['Verified', 'boolean'],
    suspicious: ['Suspicious', 'boolean']
};
const resultsPerPage = 10;

// const filterFields = {
//     name: ['Name/UTORid', 'string', null],
//     role: ['Role', 'multichoice', ['']],
//     verified: ['Verified', 'boolean', null],
//     activated: ['Activated', 'boolean', null],
//     page: ['Page', 'integer', checkPage],
//     limit: ['Page Size', 'integer'],
// }
function FilterBody({fields}) {
    return <></>
}



export default function Users() {
    const [filter, setFilter] = useState(false);
    const [selection, setSelection] = useState(undefined);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const [pageSize, setPageSize] = useState(0);

    // const {user} = useUserContext();
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token)
            return;

        fetchServer('users', {
            method: 'GET',
            headers: new Headers({'Authorization': `Bearer ${token}`})
        })
        .then(x => {
            const [result, error] = x;
            if (error) {
                setPage(0);
                setNumPages(0);
                setData([]);
                return Promise.reject(error);
            }
            return result.json();
        })
        .then(x => {
            const {results, count} = x;
            for (let i = 0; i < results.length; i++) {
                results[i].role = results[i].role[0].toUpperCase() + results[i].role.slice(1);
            }
            setPage(1);
            setNumPages(Math.ceil(count / resultsPerPage));
            setData(results);
        })
        .catch(x => console.log(x));
    }, []);

    const token = localStorage.getItem('token');
    if (!token)
        return <NotFound/>

    const buttons = <Stack direction='row' spacing={1} sx={{margin: '5px 0px'}}>
        <Button sx={{textTransform: 'none'}} variant='outlined' size='small'
                startIcon={<FilterListIcon/>} onClick={() => setFilter(true)}> 
            Filter
        </Button>
    </Stack>

    return <>
        <Typography variant='h3' sx={{marginBottom: '5px'}}>
            Transactions
        </Typography>

        <DialogGeneral title='Filter' submitTitle='Apply Filter' open={filter} setOpen={setFilter}
                        dialogStyle={{width: '400px'}}
                        submitFunc={async () => console.log('apply filter')}>
            <FilterBody fields={null} />
        </DialogGeneral>
        
        <Table columns={columns} data={data} selection={selection} setSelection={setSelection}
                page={page} numPages={numPages} buttons={buttons}/>
    </>
}