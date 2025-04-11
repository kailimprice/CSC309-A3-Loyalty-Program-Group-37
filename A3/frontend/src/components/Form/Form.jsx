import { Typography, TextField, Grid, Stack, Button, Checkbox, FormControl, Select, MenuItem,
        InputAdornment, IconButton, FormHelperText, OutlinedInput } from "@mui/material";
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {Visibility, VisibilityOff} from '@mui/icons-material';
import { useNavigate } from "react-router-dom";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { useEffect, useState } from "react";
import { validatePassword } from "../../utils/utils";
import ButtonTag from '../Button/ButtonTag.jsx'; // Ensure ButtonTag is imported


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
export function NumberInput({editable, name, field, value, changeFunc}) {
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <TextField fullWidth name={name} variant="outlined" defaultValue={value} type="number" onChange={changeFunc}/> :
            ReadOnly(value)}
        </Grid>
    </>;
} 
export function PasswordInput({name, field, changeFunc}) {
    const [password, setPassword] = useState('');
    const [visible, setVisible] = useState(false);
    const error = validatePassword(password);
    const toggleVisible = () => setVisible(!visible);
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <FormControl name={name} variant="outlined" fullWidth sx={{margin: '0px'}}>
            <OutlinedInput autoFocus
                            error={error}
                            onChange={(event) => {setPassword(event.target.value); changeFunc(event)}}
                            type={visible ? 'text' : 'password'}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton aria-label={visible ? 'hide the password' : 'display the password'}
                                                onClick={toggleVisible} edge='end'
                                                onMouseDown={(event) => event.preventDefault()}
                                                onMouseUp={(event) => event.preventDefault()}>
                                        {visible ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>}/>
            </FormControl>
        </Grid>
        {error && <>
            <Grid size={{ xs: 5, sm: 5, md: 3 }}></Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <FormHelperText error>{error}</FormHelperText>
            </Grid>
        </>}
    </>;
}
export function TextInput({editable, name, field, value, changeFunc}) {
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <TextField fullWidth name={name} variant="outlined" defaultValue={value} onChange={changeFunc}/> :
            ReadOnly(value)}
        </Grid>
    </>;
} 
export function DateInput({editable, name, field, value, changeFunc}) {
    const parsed = dayjs(value);
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker defaultValue={parsed} name={name} onChange={changeFunc} renderInput={(params) => <TextField {...params}/>}/>
            </LocalizationProvider> :
            ReadOnly(parsed.format('YYYY/MM/DD'))}
        </Grid>
    </>;
} 
export function DateTimeInput({editable, name, field, value, changeFunc}) {
    const parsed = dayjs(value);
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable ? 
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker defaultValue={parsed} name={name} onChange={changeFunc} renderInput={(params) => <TextField {...params}/>}/>
            </LocalizationProvider> :
            ReadOnly(parsed.format('YYYY/MM/DD HH:mm'))}
        </Grid>
    </>;
} 
export function FileInput({editable, name, field, value, changeFunc}) {
    function handleInput(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image')) {
            changeFunc(file);
        } else {
            console.log("HUH??");
        }
    }
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            {editable && <Stack direction='row' gap={1} alignItems='center'>
                <Button variant="outlined" component="label" startIcon={<UploadFileIcon/>}
                        sx={{textTransform: 'none', padding: '0px 10px', fontSize: '1rem'}}>
                    Upload File
                    <input type="file" name={name} hidden accept='image/*' onChange={handleInput} />
                </Button>
                {value && <Typography variant='body1' sx={{fontStyle: 'italic', color: 'grey'}}>File uploaded</Typography>}
            </Stack>}
            {!editable && value && ReadOnly(value)}
            {!editable && !value && <Typography variant='body1' sx={{fontStyle: 'italic', color: 'grey'}}>No file uploaded</Typography>}
        </Grid>
    </>
}
export function BooleanInput({editable, name, field, value, changeFunc}) {
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <Checkbox checked={value == null ? false : value} onChange={(event) => {changeFunc(event)}}
                        name={name} disabled={!editable} sx={{height: '33px', marginLeft: '-10px'}}/>
        </Grid>
    </>
}
export function ChoiceInput({editable, name, field, value, choices, changeFunc}) {
    const choicesDisplay = choices.map(x => x[0].toUpperCase() + x.slice(1));
    editable &&= choices.includes(value);
    return <>
        {GridHeader(field)}
        {editable && 
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <FormControl fullWidth>
                <Select defaultValue={value} name={name} onChange={changeFunc}>
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
export function UsersInput({ editable, field, users, choices, handleRemoveUser, handleAddUser, currentUser }) {
    return <>
        {GridHeader(field)}
        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <div style={{ gap: "0.3rem", display: "flex" }}>
                {users?.map((user) => (
                    <ButtonTag key={user.id} value={user.utorid} type={`tag-${user.role}`} id={user.id}
                        // only deletable if editable or current user is the current user
                        options={editable || user.id === currentUser.id ? "deletable" : undefined}
                        // if current user is the target user they can delete themselves
                        changeFunc={(unusedId, utorid) => (user.id === currentUser.id || editable) ? handleRemoveUser(unusedId, utorid) : undefined} />
                    ))}
                    {/* if user has permission or they are not already in users  */}
                {(editable || !users?.some((user) => user.id === currentUser.id)) && (
                    <ButtonTag key={1000} value={"+"} options={choices} changeFunc={(unusedId, utorid) => handleAddUser(unusedId, utorid)} type="tag-add" id={1000} />
                )}
            </div>
        </Grid>
    </>;
}