import {DataGrid} from '@mui/x-data-grid';
import {useNavigate} from 'react-router-dom';

export default function Table({columns, data, selections, setSelections}) {
    // TODO height/width should fill remaining space
    // TODO automatically calculate column width proportions
    const navigate = useNavigate();
    return <DataGrid rows={data} columns={columns} pageSizeOptions={[10, 10]}
                sx={{borderLeft: 0, borderRight: 0, height: '50%', width: '75%',
                    '& .MuiDataGrid-columnHeader': {backgroundColor: '#edebeb'},
                    '& .MuiDataGrid-columnHeaderTitle': {fontWeight: 'bold'}}}
                initialState={{pagination: {page: 0, pageSize: 5}}} checkboxSelection
                selectionModel={selections}
                onSelectionModelChange={(selection) => setSelections(selection.selectionModel)}
                onRowDoubleClick={(params) => navigate(`${params.row.id}`)}/>
}