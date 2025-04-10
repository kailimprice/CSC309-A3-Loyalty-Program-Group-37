/*
/transactions (manager+)
- name, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page, limit

/users/me/transactions (regular+)
- type, relatedId, promotionId, amount, operator, page, limit
*/
import Typography from '@mui/joy/Typography';
import Table from '../../components/Table/Table.jsx'
import {useState, useEffect} from 'react'
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FilterListIcon from '@mui/icons-material/FilterList';
import {Stack, Button} from '@mui/material';
import {DialogGeneral, FilterBody} from '../../components/DialogGeneral/DialogGeneral.jsx';
import {useUserContext} from '../../contexts/UserContext';
import {fetchServer, hasPerms} from "../../utils/utils";
import NotFound from "../NotFound/NotFound.jsx"
import {useSearchParams, useLocation, useNavigate} from 'react-router-dom';

const resultsPerPage = 10;

export default function Transactions() {
    const [selection, setSelection] = useState(undefined);
    const [filterOpen, setFilterOpen] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const {viewAs, updateDisplay, relatedIdDesc} = useUserContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const location = useLocation();
    const baseUrl = hasPerms(viewAs, 'manager') ? 'transactions' : 'users/me/transactions';

    const transactionTypes = ['Adjustment', 'Event', 'Purchase', 'Redemption', 'Transfer'];
    const columns = {
        id: ['ID', 'number'],
        type: ['Type', 'link', transactionTypes],
        createdBy: ['Creator', 'string'],
        utorid: ['UTORid', 'string'],
        name: ['Name', 'string'],
        amount: ['Points', 'number'],
        purchaser: ['Purchaser', 'string'],
        transfer: ['Transferee', 'string'],
        processedBy: ['Processor', 'string']
    };
    if (hasPerms(viewAs, 'manager')) {
        columns.suspicious = ['Suspicious', 'boolean', null, changeSuspicious, true];
    }

    // Fetch all transactions
    async function getTransactions(token) {
        let params = location.search;
        let [response, error] = await fetchServer(`${baseUrl}${params}`, {
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
        getTransactions(token);
    }, [location.search, updateDisplay, baseUrl]);
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
    function changeSuspicious(id, suspicious) {
        changeProperty(id, `transactions/${id}/suspicious`, 'suspicious', suspicious == 'Yes' ? false : true);
    }

    // Filter
    const filterFields = {
        type: ['Type', transactionTypes.map(x => [x, x.toLowerCase()]), null, 'relatedId'],
        promotionId: ['Promotion ID', 'number'],
        amount: ['Amount', 'threshold'] // amount + operator
    };
    if (relatedIdDesc != '') {
        filterFields.relatedId = [relatedIdDesc, 'number'];
    } else {
        delete filterFields.relatedId;
    }
    if (hasPerms(viewAs, 'manager')) {
        filterFields.utorid = ['UTORid', 'text'];
        filterFields.name = ['Name', 'text'];
        filterFields.createdBy = ['Creator', 'text'];
        filterFields.suspicious = ['Suspicious', 'boolean'];
    }

    async function applyFilter(json) {
        for (let key in json) {
            if (json[key] == '')
                delete json[key];
        }
        if (!json['amount'])
            delete json['operator'];
        console.log(json);
        setSearchParams(json);
    }

    // Buttons in table header
    const navigate = useNavigate();
    const buttons = <Stack direction='row' spacing={1} sx={{margin: '5px 0px'}}>
        <Button sx={{textTransform: 'none'}} variant='outlined' size='small' disabled={!selection}
                        startIcon={<FormatListBulletedIcon/>} onClick={() => navigate(`./${selection}`)}> 
            View
        </Button>
        <Button sx={{textTransform: 'none'}} variant='outlined' size='small'
                startIcon={<FilterListIcon/>} onClick={() => setFilterOpen(true)}> 
            Filter
        </Button>
    </Stack>

    return <>
        <Typography variant='h3' sx={{marginBottom: '5px'}}>
            Transactions
        </Typography>

        <DialogGeneral title='Filter' submitTitle='Apply' open={filterOpen} setOpen={setFilterOpen}
                        dialogStyle={{width: '500px'}}
                        submitFunc={applyFilter}>
            <FilterBody fields={filterFields}/>
        </DialogGeneral>
        
        <Table columns={columns} data={data} page={page} numPages={numPages} buttons={buttons} selection={selection} setSelection={setSelection}/>
    </>
}