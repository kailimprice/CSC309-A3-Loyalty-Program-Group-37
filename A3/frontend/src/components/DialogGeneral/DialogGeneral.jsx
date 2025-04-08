import {useState} from 'react'
import {Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle} from '@mui/material';

/**
 * General-purpose dialog box. In your code, add a state:
 * const [open, setOpen] = useState(false);
 * Then add a button that does setOpen(true).
 * 
 * @param title Title of dialog box  
 * @param children Add form elements here
 * @param submitTitle Title of the submit button at the bottom
 * @param open React state part 1
 * @param setOpen React state part 2
 * @param submitFunc An asynchronous function that takes in the JSON form in {children}.
 *                  If error, it returns a string describing the error. If success, return nothing.
 * @param dialogStyle Optional object for styling the dialog box (e.g. {width: '400px', ...})
 * @returns Dialog box
 */
export default function DialogGeneral({title, children, submitTitle, open, setOpen, submitFunc, dialogStyle}) {
    const [error, setError] = useState(undefined);
    return <Dialog open={open} onClose={() => setOpen(false)}
                    slotProps={{paper: {component: 'form',
                                        style: dialogStyle ? dialogStyle : {},
                                        onSubmit: (event) => {
                                            event.preventDefault();
                                            const formData = new FormData(event.currentTarget);
                                            const formJson = Object.fromEntries(formData.entries());
                                            submitFunc(formJson).then(x => {
                                                if (x)
                                                    setError(x);
                                                else
                                                    setOpen(false);
                                            });
                                        }}}}>
        <DialogTitle sx={{fontWeight: 'bold', fontSize: '32px', textAlign: 'center', marginBottom: '-10px'}}>
            {title}
        </DialogTitle>
        
        <DialogContent>
            {error && 
            <Box sx={{backgroundColor: '#ffe4e1', borderRadius: '4px', padding: '10px', marginTop: '10px', marginBottom: '10px'}}>
                <DialogContentText sx={{color: 'red'}}>{error}</DialogContentText>                   
            </Box>}
            {children}
        </DialogContent>

        <DialogActions>
            <Button sx={{width: 'calc(100% - 30px)', margin: 'auto', marginBottom: '15px', textTransform: 'none'}}
                    type="submit" variant='contained'>{submitTitle}</Button>
        </DialogActions>
    </Dialog>;
}