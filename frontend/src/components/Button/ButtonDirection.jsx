import IconButton from '@mui/material/IconButton';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';


export default function ButtonDirection({type, disabled, size, click}) {
    return <IconButton disabled={disabled} size={size} onClick={click}>
        {type == 'left' && <NavigateBeforeIcon fontSize='inherit'/>}
        {type == 'right' && <NavigateNextIcon fontSize='inherit'/>}
    </IconButton>
}
