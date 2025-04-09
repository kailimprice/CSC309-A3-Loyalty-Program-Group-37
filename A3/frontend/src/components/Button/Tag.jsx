import {Stack, Popover, Typography} from '@mui/material';
import {useState} from 'react'
import './Button.css'

export default function Tag({value, options, type}) {
    if (typeof(value) != 'string')
        return;

    if (options == 'boolean') {
        return <span className={`no-select tag ${type}`} style={{borderRadius: '50px'}}>
            <Typography variant='body2' className={`no-select ${type}-text`} sx={{display: 'inline'}}>
                {value}
            </Typography>
        </span>
    }

    if (options.length == 0) {
        return <span className={`no-select tag ${type}`} style={{borderRadius: '50px'}}>
            <Typography variant='body2' className={`no-select ${type}-text`} sx={{display: 'inline'}}>
                {value}
            </Typography>
        </span>
    }
    return <>
        <span className={`no-select tag ${type}`} style={{borderRadius: '50px'}}>
            <Typography variant='body2' className={`no-select ${type}-text`} sx={{display: 'inline'}}>
                {value}
            </Typography>
        </span>
    </>
}
