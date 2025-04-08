import {useNavigate} from 'react-router-dom';
import Typography from '@mui/joy/Typography';
import Checkbox from '@mui/material/Checkbox';
import './Table.css'

export default function Table({columns, data, selections, setSelections}) {
    // Selection
    const toggleRow = (id) => () => {
        setSelections((x) => x.includes(id) ? x.filter(y => y != id) : [...x, id])
    };
    const toggleAll = () => {
        setSelections(selections.length != data.length ? data.map(x => x.id) : []);
    }
    
    // Text is left-aligned, numbers are right-aligned
    const alignment = columns.reduce((result, x) => {
        result[x] = typeof(data[0][x]) != 'number' ? 'left' : 'right';
        return result;
    }, {});

    // Header
    const headerContent = columns.map((x) => { 
        return <th key={x} align={alignment[x]}>
            <Typography variant='h6' sx={{color: 'rgb(50, 50, 50)'}}>
                {x}
            </Typography>
        </th>
    });
    const header = <tr>
        <th><Checkbox indeterminate={selections.length > 0 && selections.length < data.length}
                        checked={selections.length == data.length}
                        onClick={toggleAll} readOnly/></th>
        {headerContent}
    </tr>

    // Data
    const navigate = useNavigate();
    const rows = [];
    for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        const active = selections.includes(id);
        const firstCheckbox = <td key={`${i}.checkbox`} align='center'>
            <Checkbox onClick={toggleRow(id)} checked={active} readOnly/>
        </td>;

        const row = [firstCheckbox];
        for (let name of columns) {
            const cell = <td key={`${i}.${name}`} onDoubleClick={() => navigate(`/users/${id}`)}
                                onClick={toggleRow(id)}>
                <Typography variant='body1' sx={{color: 'rgb(80, 80, 80)', textAlign: alignment[name]}}>
                    {data[i][name]}
                </Typography>
            </td>
            row.push(cell);
        }
        rows.push(<tr key={i} className={active ? 'row-active' : ''}>
            {row}
        </tr>);
    }

    return <div className='table-container'>
        <table>
            <thead>
                {header}
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    </div>
}