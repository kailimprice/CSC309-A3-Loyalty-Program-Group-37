import {useNavigate} from 'react-router-dom';
import {Stack} from '@mui/material';
import Typography from '@mui/joy/Typography';
import ButtonDirection from '../Button/ButtonDirection';
import './Table.css'

function parseDate(string) {
    if (!string)
        return null;
    const date = new Date(string);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

export default function Table({columns, data, selection, setSelection, page, numPages, buttons}) {
    // Selection
    const toggleRow = (id) => () => {
        setSelection((x) => x == id ? undefined : id);
    };
    
    // Text is left-aligned, numbers are right-aligned
    const alignment = Object.keys(columns).reduce((result, x) => {
        if (data.length == 0 || typeof(data[0][x]) != 'number')
            result[x] = 'left';
        else
            result[x] = 'right';
        return result;
    }, {});

    // Header
    const headerContent = Object.keys(columns).map((x) => { 
        return <th key={x} align={alignment[x]}>
            <Typography variant='h6' sx={{color: 'rgb(50, 50, 50)'}}>
                {columns[x][0]}
            </Typography>
        </th>
    });
    const header = <tr>
        {headerContent}
    </tr>

    // Data
    const navigate = useNavigate();
    const rows = [];
    for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        const active = selection == id;

        const row = [];
        for (let name in columns) {
            const format = columns[name][1];

            const cell = <td key={`${i}.${name}`} onDoubleClick={() => navigate(`/users/${id}`)}
                                onClick={toggleRow(id)}>
                {['string', 'number', 'date'].includes(format) &&
                <Typography variant='body1' sx={{color: 'rgb(80, 80, 80)', textAlign: alignment[name]}}>
                    {format == 'date' && parseDate(data[i][name])}
                    {format != 'date' && data[i][name]}
                </Typography>}
                {format == 'boolean' &&
                'bool'}
                {Array.isArray(format) &&
                'multichoice'}
            </td>
            row.push(cell);
        }
        rows.push(<tr key={i} className={active ? 'row-active' : ''}>
            {row}
        </tr>);
    }

    // Footer
    const footer = <tr>
        <td colSpan={Object.keys(columns).length}>
            <Stack direction='row' sx={{justifyContent: 'space-between'}}>
                {buttons}
                <Stack direction='row' spacing={1} sx={{justifyContent: 'flex-end', alignItems: 'center'}}>
                    <Typography variant='body2' align='right' sx={{color: 'rgb(150, 150, 150)'}}>
                        Page {page} of {numPages}
                    </Typography>
                    <ButtonDirection type='left' disabled={true} size='small'/>
                    <ButtonDirection type='right' disabled={false} size='small'/>
                </Stack>
            </Stack>
        </td>
    </tr>;

    return <div className='table-container'>
        <table>
            <thead>
                {header}
            </thead>
            <tbody>
                {rows}
            </tbody>
            <tfoot>
                {footer}
            </tfoot>
        </table>
    </div>
}