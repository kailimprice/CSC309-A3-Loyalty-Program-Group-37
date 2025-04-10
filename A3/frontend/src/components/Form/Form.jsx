import { Typography, TextField, Grid, Stack, Button } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useNavigate } from "react-router-dom";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useState } from "react";

export function SpecificHeader({display, baseUrl, id}) {
    const navigate = useNavigate();

    return <Stack direction='row' sx={{marginBottom: '10px'}}>
        <Typography variant='body1' className='body-header' id='body-header-link' onClick={() => navigate(baseUrl)}>
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
        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
            <Typography variant='body1'>{field}</Typography>
        </Grid>
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <TextField fullWidth variant="outlined" value={value} type="number" onChange={changeFunc}/> :
            <Typography variant='body1'>{value}</Typography>}
        </Grid>
    </>;
} 
export function TextInput({editable, field, value, changeFunc}) {
    return <>
        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
            <Typography variant='body1'>{field}</Typography>
        </Grid>
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <TextField fullWidth variant="outlined" value={value} onChange={changeFunc}/> :
            <Typography variant='body1'>{value}</Typography>}
        </Grid>
    </>;
} 
export function DateInput({editable, field, value, changeFunc}) {
    // TODO make birthday input width stretch 100%
    const parsed = dayjs(value);
    return <>
        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
            <Typography variant='body1'>{field}</Typography>
        </Grid>
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker value={parsed} onChange={changeFunc} renderInput={(params) => <TextField {...params}/>}/>
            </LocalizationProvider> :
            <Typography variant='body1'>{parsed.format('YYYY/MM/DD')}</Typography>}
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
        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
            <Typography variant='body1'>{field}</Typography>
        </Grid>
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable && <>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon/>}
                        sx={{textTransform: 'none', padding: '0px 10px', fontSize: '1rem'}}>
                    Upload File
                    <input type="file" hidden accept='image/*' onChange={handleInput} />
                </Button>
            </>}
            {!editable && <Typography variant='body1'>{value}</Typography>}
        </Grid>
    </>
}
export function BooleanInput({editable, field, value, changeFunc}) {

}
export function ChoiceInput() {

}