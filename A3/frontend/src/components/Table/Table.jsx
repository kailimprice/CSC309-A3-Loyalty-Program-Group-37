import {useNavigate} from 'react-router-dom';
import Typography from '@mui/joy/Typography';
import Checkbox from '@mui/material/Checkbox';
import './Table.css'

export default function Table({columns, data, selections, setSelections}) {
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
        <th><Checkbox /></th>
        {headerContent}
    </tr>

    // Data
    const navigate = useNavigate();
    const rows = [];
    for (let i = 0; i < data.length; i++) {
        const doubleClick = () => navigate(data[i].id);
        const row = [<td key={`${i}.checkbox`} align='center'><Checkbox /></td>];
        for (let name of columns) {
            const cell = <td key={`${i}.${name}`} onDoubleClick={doubleClick}>
                <Typography variant='body1' sx={{color: 'rgb(80, 80, 80)', textAlign: alignment[name]}}>
                    {data[i][name]}
                </Typography>
            </td>
            row.push(cell);
        }
        rows.push(<tr key={i} onDoubleClick={doubleClick}>
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