import { TextField, Button, Grid, Dialog, Box } from '@mui/material';
import { useState, useEffect } from 'react'
import { useUserContext } from '../../contexts/UserContext.jsx';
import { fetchServer } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import { Alert, Typography, Stack } from '@mui/material'; 
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditSharpIcon from '@mui/icons-material/EditSharp';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { DialogGeneral, FilterBody } from '../../components/DialogGeneral/DialogGeneral.jsx';


export default function Transaction() {

    const { user, token } = useUserContext();

    const id = parseInt(useParams().id, 10);
    const navigate = useNavigate();

    const [utorid, setUtorid] = useState(""); 
    const [type, setType] = useState(""); 
    const [spent, setSpent] = useState(0); 
    const [amount, setAmount] = useState(0); 
    const [suspicious, setSuspicious] = useState(false); 
    const [processed, setProcessed] = useState(false); 
    const [remark, setRemark] = useState(""); 
    const [createdBy, setCreatedBy] = useState(""); 
    const [relatedId, setRelatedId] = useState(""); 

    // error tracking
    const [error, setError] = useState("");
    const [permission, setPermission] = useState(false);

    // QR code display
    const [qrOpen, setQrOpen] = useState(false);
    const closeQr = () => setQrOpen(false);
    const DialogQR = <Dialog open={qrOpen} onClose={closeQr} className='dialog-qr'>
        <Box sx={{padding: '45px'}}>
            <QRCode value={{id: user.id, transaction: id}} size='large' />
        </Box>
    </Dialog>;


    // adjustment dialog display
    const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
    const adjustmentFields = {
        amount: ['Amount', 'number', true], 
        remark: ['Remark', 'text'], 
        promotionIds: ['Promotion IDs', 'ids'],
    };

    // get event details for given id
    useEffect(() => {
        // wrap in async to use await
        const getTransactionDetails = async () => {
            let transactionDetails;

            // fetch from transactions/:transactionId
            const [response, err] = await fetchServer(`transactions/${id}`, {
                method: "GET",
                headers: new Headers({
                    Authorization: `Bearer ${token}`
                })
            })
            if (err) {
                setError("You do not have permission to view this transaction.");
                console.error("Error fetching transaction details:", err);
                return;
            }

            transactionDetails = await response.json();

            // set permision for viewing this transaction
            // in api a2 doesnt specify that createdBy or utorid can view
            const hasPermission = user.role === "manager" || user.role === "superuser";

            if (!hasPermission) {
                setError("You do not have permission to view this transaction.");
                console.error("Permission denied: User cannot edit this transaction.");
                return;
            }

            setUtorid(transactionDetails.utorid || "");
            setType(transactionDetails.type || "");
            setSpent(transactionDetails.spent !== undefined ? transactionDetails.spent : 0);
            setAmount(transactionDetails.amount !== undefined ? transactionDetails.amount : 0);
            setSuspicious(transactionDetails.suspicious || false);
            setProcessed(transactionDetails.processed || false);
            setRemark(transactionDetails.remark || "");
            setCreatedBy(transactionDetails.createdBy || "");
            setRelatedId(transactionDetails.relatedId || "");

            console.log("Transaction details:", transactionDetails);

            setPermission(true);
        };

        // call func
        getTransactionDetails();
    }, [id])


    const handleToggleSuspicious = async (suspicious) => {
        
        let updateDetails = {};
        // they will be because otherwise you cant see the published button
        if (user.role === "manager" || user.role === "superuser") {
            if (suspicious !== undefined) updateDetails.suspicious = suspicious;
        }

        console.log("Updated details being sent:", updateDetails);
        // patch to events/:eventId
        const [response, err] = await fetchServer(`transactions/${id}/suspicious`, {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
        })
        
        if (err) {
            setError(err);
            console.error("Error marking transaction suspicious:", err);
            return;
        } 

        setSuspicious(suspicious);

        setError(""); 
    };


    const handleToggleProcessed = async (processed) => {
        
        let updateDetails = {};
        // they will be because otherwise you cant see the published button
        if (user.role === "manager" || user.role === "superuser") {
            if (processed !== undefined) updateDetails.processed = processed;
        }

        console.log("Updated details being sent:", updateDetails);
        // patch to events/:eventId
        const [response, err] = await fetchServer(`transactions/${id}/processed`, {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
        })
        
        if (err) {
            setError(err);
            console.error("Error marking transaction processed:", err);
            return;
        } 

        setProcessed(processed);

        setError(""); 
    };

    const handleQRCode = () => {
        setQrOpen(true); 
    };

    const handleCreateAdjustment = async (formData) => {
        try {
            // preset data for utorid, type, and transactions 
            const adjustmentDetails = {
                ...formData,
                amount: parseInt(formData.amount, 10),
                relatedId: id, 
                utorid: utorid,
                type: "adjustment",
            };

            // from sidebar
            if ('promotionIds' in adjustmentDetails) {
                adjustmentDetails['promotionIds'] = adjustmentDetails['promotionIds']
                                        .replace(/\s+/g, '')
                                        .split(',')
                                        .map(x => parseInt(x, 10))
                                        .filter(x => !isNaN(x));
            }

            const [response, err] = await fetchServer(`transactions`, {
                method: "POST",
                headers: new Headers({
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                }),
                body: JSON.stringify(adjustmentDetails),
            });

            if (err) {
                console.error("Error creating adjustment:", err);
                return `Error: ${err.message}`;
            }

            console.log("Adjustment created successfully:", await response.json());
            return;
        } catch (err) {
            console.error("Error:", err);
            return "Failed to create adjustment.";
        }
    };

    const AdjustmentDialog = <DialogGeneral
            title="Create Adjustment"
            submitTitle="Submit"
            open={adjustmentDialogOpen}
            setOpen={setAdjustmentDialogOpen}
            submitFunc={handleCreateAdjustment}
            dialogStyle={{ width: "450px" }}
        >
        <FilterBody fields={adjustmentFields} />
    </DialogGeneral>

    const header = <Stack direction='row'>
        <Typography variant='body1' className='body-header' id='body-header-link' onClick={() => navigate('/transactions')}>
            Transactions
        </Typography>
        <Typography variant='body2' className='body-header'>
            /
        </Typography>
        <Typography variant='body1' className='body-header'>
            {id}
        </Typography>
    </Stack>;

    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    // Grid setup inspired by https://mui.com/material-ui/react-Grid/
    return <>
        {header}
        {DialogQR}
        {AdjustmentDialog}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
                {(permission && (user.role === "cashier" || user.role === "manager" || user.role === "superuser")) &&
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ 
                            backgroundColor: suspicious ? "#4467C4" : "white",
                            color: suspicious ? "white" : "#4467C4",
                            // lighter shade
                            "&:hover": {
                                backgroundColor: suspicious ? "#365a9d" : "#f0f0f0", 
                            }, 
                            width: "200px",
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px" }}
                        onClick={() => handleToggleSuspicious(!suspicious)}
                    >
                        {suspicious ? <ErrorIcon /> : <ErrorOutlineIcon/>}
                        {suspicious ? "Suspicious" : "Unsuspicious"}
                    </Button>
                }
                {(permission && (type === "redemption") && (user.role === "manager" || user.role === "superuser")) &&
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ 
                            backgroundColor: processed ? "#4467C4" : "white",
                            color: processed ? "white" : "#4467C4",
                            // lighter shade
                            "&:hover": {
                                backgroundColor: processed ? "#365a9d" : "#f0f0f0", 
                            }, 
                            width: "200px",
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px" }}
                            // processed can only be set to true
                        onClick={() => handleToggleProcessed(true)}
                    >
                        {processed ? <VerifiedIcon /> : <VerifiedOutlinedIcon/>}
                        {processed ? "Processed" : "Unprocessed"}
                    </Button>
                }
                {(permission && (type === "purchase") && (user.role === "manager" || user.role === "superuser")) &&
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ 
                            backgroundColor: adjustmentDialogOpen ? "#4467C4" : "white",
                            color: adjustmentDialogOpen ? "white" : "#4467C4",
                            // lighter shade
                            "&:hover": {
                                backgroundColor: adjustmentDialogOpen ? "#365a9d" : "#f0f0f0", 
                            }, 
                            width: "200px",
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px" }}
                            // open dialog box
                        onClick={() => setAdjustmentDialogOpen(true)}
                    >
                        <EditSharpIcon />
                        Adjustment
                    </Button>
                }
                {(permission && (user.role === "manager" || user.role === "superuser")) &&
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ 
                            backgroundColor: qrOpen ? "#4467C4" : "white",
                            color: qrOpen ? "white" : "#4467C4",
                            // lighter shade
                            "&:hover": {
                                backgroundColor: qrOpen ? "#365a9d" : "#f0f0f0", 
                            }, 
                            width: "200px",
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px" }}
                        onClick={() => handleQRCode()}
                    >
                        <QrCode2Icon />
                        Scan QR Code
                    </Button>
                }
            </div>
        </div>
        <Grid container spacing={2} padding={3} alignItems={'center'}>
        {/* display error message if one*/}
        {error && (
                <Grid size={12}>
                    {/* alerts: https://mui.com/material-ui/react-alert/?srsltid=AfmBOoou_o4_8K8hszRKhrNwGHIQi0AiFRewwf3tT0chGeQsevtOFnp2 */}
                    <Alert severity="error">{error}</Alert>
                </Grid>
        )}

        {permission && (
            <>
            {utorid &&
            <>
            {/* display utorid */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Utorid</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    value={utorid}
                    disabled={true}
                />
            </Grid>
            </>
            }

            {/* display utorid */}
            {createdBy &&
            <>
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Created By</p>
            </Grid>
                <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        value={createdBy}
                        disabled={true}
                    />
                </Grid>
            </>
            }

             {/* display related to */}
            {relatedId && (
                <>
                    <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                        {/* switch name based off type */}
                        <p>
                        {type === "adjustment"
                            ? "Related Transaction"
                            : type === "redemption"
                            ? "Processed By"
                            : type === "transfer"
                            ? "Recipient"
                            : type === "event"
                            ? "Event"
                            : "Related To"}
                        </p>
                    </Grid>
                    {/* link back to user/transaction/event */}
                    <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                        <div
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                                if (type === "adjustment") {
                                    navigate(`/transactions/${relatedId}`);
                                } else if (type === "redemption" || type === "transfer") {
                                    navigate(`/users/${relatedId}`);
                                } else if (type === "event") {
                                    navigate(`/events/${relatedId}`);
                                }
                            }}
                        >
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={relatedId}
                                // https://mui.com/material-ui/react-text-field/?srsltid=AfmBOooET4cEcEITVoWhpumppCL95VBlwi_YX9NN6F2xpSJJML4TfO0h#inputs
                                slotProps={{
                                    input: {
                                        readOnly: true, 
                                    },
                                    sx: { cursor: "pointer" }
                                }}
                            />
                        </div>
                    </Grid>
                </>
            )}

            {/* display type */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Type</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    value={type}
                    disabled={true}
                />
            </Grid>

             {/* display remark */}
             {remark && 
             <>
             <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Remark</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    value={remark}
                    disabled={true}
                />
            </Grid>
            </>
            }

            {/* display spent */}
            {spent > 0 && 
            <>
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Spent</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    // numeric
                    type="number"
                    value={spent || ""}
                    disabled={true}
                />
            </Grid>
            </>
            }

             {/* display amount */}
             {amount > 0 && 
            <>
             <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Amount</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    // numeric
                    type="number"
                    value={amount || ""}
                    disabled={true}
                />
            </Grid>
            </>
            }
            </>
            )}
        </Grid> 
    </>
}