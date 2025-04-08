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
import {useState} from 'react'
import FilterListIcon from '@mui/icons-material/FilterList';
import {Box, Button} from '@mui/material';
import DialogGeneral from '../../components/DialogGeneral/DialogGeneral.jsx';

const columns = ['id', 'firstName', 'lastName', 'age', 'fullName'];
const rows = [
    { id: 1, lastName: 'Snow', firstName: 'Jon', age: 35 },
    { id: 2, lastName: 'Lannister', firstName: 'Cersei', age: 42 },
    { id: 3, lastName: 'Lannister', firstName: 'Jaime', age: 45 },
    { id: 4, lastName: 'Stark', firstName: 'Arya', age: 16 },
    { id: 5, lastName: 'Targaryen', firstName: 'Daenerys', age: null },
    { id: 6, lastName: 'Melisandre', firstName: null, age: 150 },
    { id: 7, lastName: 'Clifford', firstName: 'Ferrara', age: 44 },
    { id: 8, lastName: 'Frances', firstName: 'Rossini', age: 36 },
    { id: 9, lastName: 'Roxie', firstName: 'Harvey', age: 65 },
];

export default function Users() {
    const [filter, setFilter] = useState(false);
    const [selections, setSelections] = useState([]);

    return <>
        <Typography variant='h3'>
            Transactions
        </Typography>

        <DialogGeneral title='Filter' submitTitle='Apply Filter' open={filter} setOpen={setFilter}
                        dialogStyle={{width: '400px'}}
                        submitFunc={async () => console.log('apply filter')}>
            <h1>Hi!</h1>
        </DialogGeneral>
        
        <Box sx={{display: 'flex', gap: '5px', margin: '10px 0px'}}>
            <Button sx={{textTransform: 'none'}} variant='outlined'
                    startIcon={<FilterListIcon/>} onClick={() => setFilter(true)}> 
                Filter
            </Button>
            
            <Button sx={{textTransform: 'none'}} variant='outlined'
                    disabled={selections.length == 0}>
                Set Role
            </Button>
            
            <Button sx={{textTransform: 'none'}} variant='outlined'
                    disabled={selections.length == 0}>
                Toggle Verified
            </Button>
            
            <Button sx={{textTransform: 'none'}} variant='outlined'
                    disabled={selections.length == 0}>
                Toggle Suspicious
            </Button>
        </Box>
        <Table columns={columns} data={rows} selections={selections} setSelections={setSelections}></Table>        
    </>
}