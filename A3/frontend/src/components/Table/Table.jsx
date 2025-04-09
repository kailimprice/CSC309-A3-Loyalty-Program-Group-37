import {useNavigate} from 'react-router-dom';
import {Stack} from '@mui/material';
import Typography from '@mui/joy/Typography';
import ButtonDirection from '../Button/ButtonDirection';
import ButtonTag from '../Button/ButtonTag';
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
    function toggleRow(id) {
        return (event) => {
            if (!Array.from(event.target.classList).includes('no-select')) {
                setSelection((x) => x == id ? undefined : id);
            }
        }
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
    function doubleClick(id) {
        return (event) => {
            if (!Array.from(event.target.classList).includes('no-select')) {
                navigate(`./${id}`);
            }
        }
    }

    const rows = [];
    for (let i = 0; i < data.length; i++) {
        const id = data[i].id;
        const active = selection == id;

        const row = [];
        for (let colName in columns) {
            const format = columns[colName][1];
            const settable = columns[colName].length > 2 ? columns[colName][2] : null;
            const changeFunc = columns[colName].length > 3 ? columns[colName][3] : null;
            const editable = columns[colName].length > 4 ? columns[colName][4] : null;
            
            const value = data[i][colName];
            let cellContent;
            if (Array.isArray(format) && editable) {
                cellContent = <ButtonTag value={value}
                                        type={`tag-${value.toLowerCase()}`}
                                        id={data[i].id}
                                        options={settable}
                                        changeFunc={changeFunc}/>
            } else if (format == 'boolean' && editable) {
                cellContent = <ButtonTag value={value == true ? 'Yes' : value == false ? 'No' : null}
                                        id={data[i].id}
                                        type='tag-boolean'
                                        options={['No', 'Yes']}
                                        changeFunc={changeFunc}/>
            } else if (format == 'boolean') {
                cellContent = <Typography variant='body1' sx={{color: 'rgb(80, 80, 80)', textAlign: alignment[colName]}}>
                    {value == true ? 'Yes' : value == false ? 'No' : null}
                </Typography>
            } else {
                cellContent = <Typography variant='body1' sx={{color: 'rgb(80, 80, 80)', textAlign: alignment[colName]}}>
                    {format == 'date' && parseDate(value)}
                    {format != 'date' && value}
                </Typography>
            }
            const cell = <td key={`${i}.${colName}`} onDoubleClick={doubleClick(id)} onClick={toggleRow(id)}>
                {cellContent}
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
                <Stack direction='row' spacing={1} sx={{justifyContent: 'flex-end', alignItems: 'center'}}>
                    <ButtonDirection type='left' disabled={true} size='small'/>
                    <ButtonDirection type='right' disabled={false} size='small'/>
                    <Typography variant='body2' align='right' sx={{color: 'rgb(150, 150, 150)'}}>
                        Page {page} of {numPages}
                    </Typography>
                </Stack>
                {buttons}
            </Stack>
        </td>
    </tr>;

    return <div className='table-container'>
        <table>
            <tbody>
                {header}
            </tbody>
            <tfoot>
                {rows}
            </tfoot>
            <thead>
                {footer}
            </thead>
        </table>
    </div>
}