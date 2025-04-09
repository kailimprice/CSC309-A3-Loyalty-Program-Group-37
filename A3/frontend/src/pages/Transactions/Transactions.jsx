/*
/transactions (manager+)
- name, createdBy, suspicious, promotionId, type, relatedId, amount, operator, page, limit
//Need to be able to edit suspicious/not

/users/me/transactions (regular+)
- type, relatedId, promotionId, amount, operator, page, limit
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

const columns = {
    id: ['ID', 'number'],
    type: ['Type', ['Adjustment', 'Event', 'Purchase', 'Redemption', 'Transfer']],
    createdBy: ['Creator', 'string'],
    amount: ['Points', 'number'],
    suspicious: ['Suspicious', 'boolean', null, () => console.log('hi'), true],
    processedBy: ['Processed', 'boolean'],
    sender: ['Sender', 'string'],
    recipient: ['Recipient', 'string'],
    related: ['Related', 'string']
};

export default function Transactions() {
    const [filterOpen, setFilterOpen] = useState(false);
    const [data, setData] = useState([]);
    const [page, setPage] = useState(0);
    const [numPages, setNumPages] = useState(0);
    const {viewAs, updateDisplay} = useUserContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const token = localStorage.getItem('token');
    const location = useLocation();
    const baseUrl = hasPerms(viewAs, 'manager') ? 'transactions' : 'users/me/transactions';

    // Fetch all users
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
        console.log(results);
        for (let i = 0; i < results.length; i++) {
            const {type, infoAdjustment, infoEvent, infoPurchase, infoRedemption, infoTransfer} = results[i];
            results[i].type = type[0].toUpperCase() + type.slice(1);
            
            if (infoAdjustment) {
                results[i].amount = infoRedemption.amount;
                results[i].suspicious = infoAdjustment.suspicious;
            } else if (infoEvent) {
                results[i].amount = infoEvent.awarded;
                results[i].suspicious = null;
            } else if (infoPurchase) {
                results[i].amount = infoPurchase.spent;
                results[i].suspicious = infoPurchase.suspicious;
            } else if (infoRedemption) {
                results[i].amount = infoRedemption.amount;
                results[i].suspicious = null;
            } else if (infoTransfer) {
                results[i].amount = infoTransfer.sent;
                results[i].suspicious = null;
            }

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
        getTransactions(token);
    }, [location.search, updateDisplay, baseUrl]);
    if (!token)
        return <NotFound/>
    
    // In-page changes
    async function changeProperty(id, key, value, transform) {
        transform = transform ? transform : x => x;
        const json = {};
        json[key] = transform(value);

        // Change server
        let [response, error] = await fetchServer(`transactions/${id}`, {
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
                    // if (key == 'role') {
                    //     if (value == 'Cashier') {
                    //         newData[i].suspicious = false;
                    //     } else {
                    //         newData[i].suspicious = null;
                    //     }
                    // }
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
            Users
        </Typography>

        <DialogGeneral title='Filter' submitTitle='Apply' open={filterOpen} setOpen={setFilterOpen}
                        dialogStyle={{width: '400px'}}
                        submitFunc={applyFilter}>
            <FilterBody fields={filterFields}/>
        </DialogGeneral>
        
        <Table columns={columns} data={data} page={page} numPages={numPages} buttons={buttons}/>
    </>
}