import {useState} from 'react';
import {useSearchParams, useLocation, useNavigate} from 'react-router-dom';
import {Stack} from '@mui/material';
import Typography from '@mui/joy/Typography';
import ButtonDirection from '../Button/ButtonDirection';
import ButtonTag from '../Button/ButtonTag';
import Tag from '../Button/Tag';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import './Table.css'
import { TextField} from "@mui/material";

function parseDate(string) {
    if (!string)
        return null;
    const date = new Date(string);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

export default function Table({columns, data, page, numPages, buttons, selection, setSelection, providedBaseUrl}) {
    const location = useLocation();
    const [sortBy, setSortBy] = useState(new URLSearchParams(location.search).get('orderBy'));
    const [sortDirection, setSortDirection] = useState(new URLSearchParams(location.search).get('order'));

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
    const [searchParams, setSearchParams] = useSearchParams();
    function toggleSort(key) {
        return () => {
            const p = new URLSearchParams(location.search);
            if (sortBy == key) {
                if (sortDirection == 'asc') {
                    setSortDirection('desc');
                    p.set('order', 'desc');
                } else {
                    setSortDirection(null);
                    setSortBy(null);
                    p.delete('order');
                    p.delete('orderBy');
                }
            } else {
                setSortBy(key);
                setSortDirection('asc');
                p.set('orderBy', key);
                p.set('order', 'asc');
            }
            setSearchParams(p);
        }
    }
    const headerContent = Object.keys(columns).map((x) => { 
        return <th key={x} onClick={toggleSort(x)}>
            <Stack spacing={0.25} sx={{flexDirection: alignment[x] == 'left' ? 'row' : 'row-reverse', alignItems: 'center'}}>
                <Typography variant='h6' sx={{color: 'rgb(50, 50, 50)', padding: '0'}}>
                    {columns[x][0]}
                </Typography>
                {sortBy == x && <ArrowUpwardIcon sx={{width: '20px', height: '20px', transition: '0.1s', transform: `rotate(${sortDirection == 'asc' ? 360 : 180}deg)`}}/>}
            </Stack>
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
                const url = providedBaseUrl ? `${providedBaseUrl}/${id}` : `./${id}`;
                navigate(url);
            }
        };
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
                                        options={settable.includes(value) ? settable : []}
                                        changeFunc={changeFunc}/>
            } else if (Array.isArray(format)) {
                cellContent = <Tag value={value}
                                    type={`tag-${value.toLowerCase()}`}
                                    options={format}/>
            } else if (format == 'boolean' && editable) {
                cellContent = <ButtonTag value={value == true ? 'Yes' : value == false ? 'No' : null}
                                        id={data[i].id}
                                        type={`tag-boolean-${value}`}
                                        options={'boolean'}
                                        changeFunc={changeFunc}/>
            } else if (format == 'boolean') {
                cellContent = <Typography variant='body1' sx={{color: 'rgb(80, 80, 80)', textAlign: alignment[colName]}}>
                    {value == true ? 'Yes' : value == false ? 'No' : null}
                </Typography>
            } else if (format == 'link') {
                if (Array.isArray(value)) {
                    const display = `${value[0]} (ID# ${value[1]})`;
                    const type = `tag-${value[0].toLowerCase()}-clickable`;
                    const baseUrl = value[0] == 'Event' ? 'events' : 'transactions';
                    const click = () => {
                        navigate(`/${baseUrl}/${value[1]}`);
                    };
                    cellContent = <Tag value={display} type={type} options={format} click={click}/>;
                } else {
                    cellContent = <Tag value={value} type={`tag-${value.toLowerCase()}`} options={format}/>;
                }
            } else if (format === "number" && editable) {
                // textAlign: https://mui.com/material-ui/react-text-field/?srsltid=AfmBOoq6Xh1ICgV3yZl_6qNaqCTj7lwHdOf-vFg44nROl-HE5AajsYJd#customization
                cellContent = <TextField fullWidth name={colName} variant="outlined" value={value} type="number" 
                                // need to pass id in
                                onChange={(event) => changeFunc(event, data[i].utorid)}
                                sx={{
                                    '& .MuiInputBase-input': {
                                        textAlign: 'right',
                                    },
                                }}/>
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
    function incrementPage(increment) {
        return () => {
            const p = new URLSearchParams(location.search);
            let newPage = parseInt(searchParams.get('page'), 10);
            if (isNaN(newPage))
                newPage = 1;
            p.set('page', newPage + increment);
            setSearchParams(p);
        };
    }
    const footer = <tr>
        <td colSpan={Object.keys(columns).length}>
            <Stack direction='row' className='table-buttons-page-stack'>
                <Stack direction='row' spacing={1} className='table-page-stack'>
                    <ButtonDirection type='left' disabled={page <= 1} size='small' click={incrementPage(-1)}/>
                    <ButtonDirection type='right' disabled={page >= numPages} size='small' click={incrementPage(1)}/>
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
            <thead>
                {footer}
            </thead>
            <tbody>
                {header}
            </tbody>
            <tfoot>
                {rows}
            </tfoot>
        </table>
    </div>
}