import { Typography, TextField, Grid, Stack, Button, Checkbox, FormControl, Select, MenuItem } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from "react-router-dom";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useState } from "react";

function ReadOnly(text) {
    return <Typography variant='body1' sx={{display: 'flex', alignItems: 'center', height: '33px', lineHeight: '1'}}>{text}</Typography>;
}
function GridHeader(title) {
    return <Grid size={{ xs: 5, sm: 5, md: 3 }}>
        {ReadOnly(title)}
    </Grid>;
}

export function SpecificHeader({display, baseUrl, id}) {
    const navigate = useNavigate();
    const click = baseUrl ? () => navigate(baseUrl) : () => {return};

    return <Stack direction='row' sx={{marginBottom: '10px'}}>
        <Typography variant='body1' className='body-header' id='body-header-link' onClick={click}>
            {display}
        </Typography>
        <Typography variant='body2' className='body-header'>
            /
        </Typography>
        <Typography variant='body1' className='body-header'>
            {id}
        </Typography>
    </Stack>;
}
export function NumberInput({editable, field, value, changeFunc}) {
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <TextField fullWidth variant="outlined" value={value} type="number" onChange={changeFunc}/> :
            ReadOnly(value)}
        </Grid>
    </>;
} 
export function TextInput({editable, field, value, changeFunc}) {
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <TextField fullWidth variant="outlined" value={value} onChange={changeFunc}/> :
            ReadOnly(value)}
        </Grid>
    </>;
} 
export function DateInput({editable, field, value, changeFunc}) {
    // TODO make birthday input width stretch 100%
    const parsed = dayjs(value);
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker value={parsed} onChange={changeFunc} renderInput={(params) => <TextField {...params}/>}/>
            </LocalizationProvider> :
            ReadOnly(parsed.format('YYYY/MM/DD'))}
        </Grid>
    </>;
} 
export function FileInput({editable, field, value, changeFunc}) {
    function handleInput(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image')) {
            const url = URL.createObjectURL(file);
            changeFunc(url);
        } else {
            console.log("HUH??");
        }
    }
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable && <>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon/>}
                        sx={{textTransform: 'none', padding: '0px 10px', fontSize: '1rem'}}>
                    Upload File
                    <input type="file" hidden accept='image/*' onChange={handleInput} />
                </Button>
            </>}
            {!editable && value && ReadOnly(value)}
            {!editable && !value && <Typography variant='body1' sx={{fontStyle: 'italic', color: 'grey'}}>No file uploaded</Typography>}
        </Grid>
    </>
}
export function BooleanInput({editable, field, value, changeFunc}) {
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <Checkbox checked={value} onChange={changeFunc} disabled={!editable} sx={{height: '33px', marginLeft: '-10px'}}/>
        </Grid>
    </>
}
export function ChoiceInput({editable, field, value, choices, changeFunc}) {
    const choicesDisplay = choices.map(x => x[0].toUpperCase() + x.slice(1));
    editable &&= choices.includes(value);
    return <>
        {GridHeader(field)}
        {editable && 
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <FormControl fullWidth>
                <Select value={value} onChange={changeFunc}>
                    {choices.map((x, i) => {
                        return <MenuItem key={i} value={x}>{choicesDisplay[i]}</MenuItem>;
                    })}
                </Select>
            </FormControl>
        </Grid>}
        {!editable &&
        ReadOnly(value ? value[0].toUpperCase() + value.slice(1) : 'N/A')}
    </>
}
export function ButtonInputRow({children}) {
    return <Stack direction='row' gap={1} sx={{margin: '10px 0px'}}>
        {children}
    </Stack>
}
export function ButtonInput({variant, title, click, icon, disabled}) {
    return <Button variant={variant} color="primary" onClick={click} startIcon={icon} disabled={disabled}>
        {title}
    </Button>
}