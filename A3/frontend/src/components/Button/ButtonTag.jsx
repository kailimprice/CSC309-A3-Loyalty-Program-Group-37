import {Stack, Popover, Typography} from '@mui/material';
import {useState} from 'react'
import './Button.css'

export default function ButtonTag({value, options, changeFunc, type, id}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const buttonId = open ? 'simple-popover' : undefined;

    if (typeof(value) != 'string')
        return;

    function handleClick(id, field) {
        return () => {
            changeFunc(id, field);
            setAnchorEl(null);
        }
    }

    // 2 options
    if (options.length == 2) {
        return <span className={`no-select tag ${type}`} aria-describedby={buttonId} onClick={handleClick(id, value)} style={{borderRadius: '50px'}}>
            <Typography variant='body2' className={`no-select ${type}-text`} sx={{display: 'inline'}}>
                {value}
            </Typography>
        </span>
    }
    
    // 3+ options
    return <>
        <span className={`no-select tag ${type}`} aria-describedby={buttonId} style={{borderRadius: open ? '0px' : '50px'}}
                onClick={(event) => setAnchorEl(event.currentTarget)}>
            <Typography variant='body2' className={`no-select ${type}-text`} sx={{display: 'inline'}}>
                {value}
            </Typography>
        </span>
        <Popover className='no-select' id={buttonId} open={open} anchorEl={anchorEl} onClose={() => setAnchorEl(null)} anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}>
            <Stack className='no-select' direction='column'>
                {options.map(x => {
                    return <span className='no-select tag tag-option' key={`${type}-${x}`} onClick={handleClick(id, x)}>
                        <Typography className='no-select' variant='body2' sx={{color: 'rgb(100, 100, 100)'}}>{x}</Typography>
                    </span>
                })}
            </Stack>
        </Popover>
    </>
}
