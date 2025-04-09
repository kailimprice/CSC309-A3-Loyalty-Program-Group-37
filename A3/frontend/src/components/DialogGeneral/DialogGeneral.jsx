import {useState, Fragment} from 'react'
import {Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
        Typography, TextField, RadioGroup, Radio, FormControlLabel} from '@mui/material';
import { Input } from '@mui/joy'

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
export function DialogGeneral({title, children, submitTitle, open, setOpen, submitFunc, dialogStyle}) {
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
        
        <DialogContent sx={{paddingBottom: '5px'}}>
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

/**
 * General-purpose builder for filter dialog box body
 * @param fields Of the format {fieldName: [displayName, dataType]}
 * dataType supports 'text' and 'boolean'
 */
export function FilterBody({fields}) {
    const rows = [];
    for (let name in fields) {
        const [display, type] = fields[name];
        rows.push(<Fragment key={display}>
            <Typography key={display}>{display}</Typography>
            {type == 'text' &&
                <TextField 
                    fullWidth 
                    variant="outlined" 
                    margin='dense' 
                    slotProps={{htmlInput: {style: {padding: '5px 10px'}}}}
                    id={name} 
                    name={name} 
                    type={type}
                />
            }
            {type == 'boolean' &&
            <RadioGroup row sx={{justifyContent: 'center'}}>
                <FormControlLabel name={name} value={false} control={<Radio/>} label="No"/>
                <FormControlLabel name={name} value={true} control={<Radio/>} label="Yes"/>
            </RadioGroup>}
            {type == 'booleanPromotion' &&
                <RadioGroup row sx={{justifyContent: 'center'}}>
                    <FormControlLabel name={name} value={'automatic'} control={<Radio/>} label="Automatic"/>
                    <FormControlLabel name={name} value={'onetime'} control={<Radio/>} label="One-time"/>
                </RadioGroup>
                }
            {type == 'number' && 
                <TextField
                    fullWidth
                    variant='outlined'
                    margin='dense'
                    id={name}
                    name={name}
                    type='number'
                />
            }
            {type == 'dollar' && 
                <Input
                    fullWidth
                    variant="outlined"
                    margin="dense"
                    id={name}
                    name={name}
                    type="number"
                />
            }
            {type == 'ids' && 
                <TextField
                    fullWidth
                    variant="outlined"
                    margin="dense"
                    id={name}
                    name={name}
                    placeholder="1, 2, 3"
                />
            }
            {type == 'time' && 
                <TextField
                    fullWidth
                    variant="outlined"
                    margin="dense"
                    id={name}
                    name={name}
                    type="datetime-local"
                />
            }
        </Fragment>);
    }
    return <Box style={{display: 'grid', gridTemplateColumns: 'auto auto', alignItems: 'center'}}>
        {rows}
    </Box>;
}