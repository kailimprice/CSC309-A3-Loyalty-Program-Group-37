import Typography from '@mui/joy/Typography';
import Table from '../../components/Table/Table.jsx'
import {useState, useEffect} from 'react'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';
import {Stack, Button} from '@mui/material';
import {DialogGeneral, FilterBody} from '../../components/DialogGeneral/DialogGeneral.jsx';
import {useUserContext} from '../../contexts/UserContext';
import {fetchServer, hasPerms, queryRemoveLimit} from "../../utils/utils";
import NotFound from "../NotFound/NotFound.jsx"
import {useSearchParams, useLocation, useNavigate} from 'react-router-dom';

const resultsPerPage = 10;

export default function Promotions() {
    const [selection, setSelection] = useState(undefined);
    const [filterOpen, setFilterOpen] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const {user, viewAs, updateDisplay} = useUserContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const location = useLocation();

    // Fetch all promotions
    async function getPromotions(token) {
        let params = queryRemoveLimit(location.search);
        if (viewAs != user.role)
            params = `${params}${params.length == 0 ? '?' : '&'}viewAsRole=${viewAs}`;
        let [response, error] = await fetchServer(`promotions${params}`, {
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
            results[i].type = results[i].type[0].toUpperCase() + results[i].type.slice(1);
        }
        let pCount = Math.ceil(count / resultsPerPage);
        let p;
        if (count == 0) {
            p = 0;
        } else if (!searchParams.get('page')) {
            p = 1;
        } else if (searchParams.get('page') > pCount) {
            p = 0;
            pCount = 0;
        } else {
            p = parseInt(searchParams.get('page'), 10);
        }
        setPage(p);
        setNumPages(pCount);
        setData(results);
    }
    useEffect(() => {
        if (!token)
            return;
        getPromotions(token);
    }, [location.search, updateDisplay, viewAs]);
    if (!token)
        return <NotFound/>

    const columns = {
        id: ['ID', 'number'],
        name: ['Name', 'string'],
        type: ['Type', ['Automatic', 'One-time']],
        startTime: ['Start Time', 'date'],
        endTime: ['End Time', 'date'],
        minSpending: ['Minimum Spent', 'number'],
        rate: ['Rate', 'number'],
        points: ['Points', 'number']
    };

    const filterFields = {
        name: ['Name', 'text'],
        type: ['Type', [['Automatic', 'automatic'], ['One-time', 'one-time']]]
    };
    if (hasPerms(viewAs, 'manager')) {
        filterFields.started = ['Promoton Started', 'boolean'];
        filterFields.ended = ['Promoton Ended', 'boolean'];
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
        let [result, error] = await fetchServer(`promotions/${selection}`, {
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
            Promotions
        </Typography>

        <DialogGeneral title='Filter' submitTitle='Apply' open={filterOpen} setOpen={setFilterOpen}
                        dialogStyle={{width: '400px'}}
                        submitFunc={applyFilter}>
            <FilterBody fields={filterFields}/>
        </DialogGeneral>
        
        <Table columns={columns} data={data} page={page} numPages={numPages} buttons={buttons} selection={selection} setSelection={setSelection}/>
    </>
}