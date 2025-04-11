import { Button, Grid, Dialog, Box } from '@mui/material';
import { useState, useEffect } from 'react'
import { useUserContext } from '../../contexts/UserContext.jsx';
import { fetchServer, hasPerms } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import { Alert } from '@mui/material'; 
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ErrorIcon from '@mui/icons-material/Error';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import EditSharpIcon from '@mui/icons-material/EditSharp';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { DialogGeneral, FilterBody } from '../../components/DialogGeneral/DialogGeneral.jsx';
import { SpecificHeader, TextInput, NumberInput,
    ButtonInput, ButtonInputRow, } from '../../components/Form/Form.jsx';

export default function Transaction() {

    const { user, token, viewAs } = useUserContext();

    const id = parseInt(useParams().id, 10);
    const navigate = useNavigate();

    const [currTransaction, setCurrTransaction] = useState({});

    // error tracking
    const [error, setError] = useState("");

    // different permission for a manager/superuser, owner, and cashier
    const isManager = hasPerms(viewAs, 'manager');
    const hasPermission = isManager;
    const [isOwner, setIsOwner] = useState(false);
    const isCashier = hasPerms(viewAs, 'cashier');
    const canProcess = isCashier && currTransaction.type === "redemption";

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

    async function getTransactionDetails() {
        let transactionDetails;

        // fetch from transactions/:transactionId
        const [response1, err1] = await fetchServer(`transactions/${id}`, {
            method: "GET",
            headers: new Headers({
                Authorization: `Bearer ${token}`
            })
        })

        let err2;
        // they dont have clearance, need to search users personal transactions
        if (err1) {
            let [response2, err2] = await fetchServer(`users/me/transactions/`, {
                method: "GET",
                headers: new Headers({
                    Authorization: `Bearer ${token}`
                })
            })

            if (!err2) {
                const { results: transactions } = await response2.json();
                // get matching transaction if exists
                transactionDetails = transactions.find((transaction) => transaction.id === id); 
                if (transactionDetails) {
                    setIsOwner(true);
                    setCurrTransaction(() => ({
                        ...transactionDetails,
                        utorid: user.utorid,
                    })); 
                } 
            }
        // no error so set transaction
        } else {
            transactionDetails = await response1.json();
            setCurrTransaction(transactionDetails);
        }
        
        if (err1 && err2) {
            setError("You do not have permission to view this transaction.");
            console.error("Error fetching transaction details:", err2);
            return;
        }

        console.log("Transaction details:", transactionDetails);
    };

    // get event details for given id
    useEffect(() => {
        getTransactionDetails();
    }, [id])


    const handleToggleSuspicious = async (suspicious) => {

        // patch to suspicious
        const [response, err] = await fetchServer(`transactions/${id}/suspicious`, {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify({ "suspicious": suspicious})
        })
        
        if (err) {
            setError(err);
            console.error("Error marking transaction suspicious:", err);
            return;
        } 

        setCurrTransaction((prevTransaction) => ({
            ...prevTransaction,
            suspicious: suspicious,
        }));

        setError(""); 
        getTransactionDetails();
    };


    const handleToggleProcessed = async (processed) => {
        // patch to processed
        const [response, err] = await fetchServer(`transactions/${id}/processed`, {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify({ "processed": processed})
        })
        
        if (err) {
            setError(err);
            console.error("Error marking transaction processed:", err);
            return;
        } 

        setCurrTransaction((prevTransaction) => ({
            ...prevTransaction,
            processed: processed,
        }));

        setError(""); 
        getTransactionDetails();
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
                utorid: currTransaction.utorid,
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

            getTransactionDetails();
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

    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    // Grid setup inspired by https://mui.com/material-ui/react-Grid/
    return <>
        <SpecificHeader display='Transactions' baseUrl='/transactions' id={id} />
        {DialogQR}
        {AdjustmentDialog}
        <Grid container spacing={0} alignItems={'center'}>
            {error && 
            <Grid size={12}>
                {/* alerts: https://mui.com/material-ui/react-alert/?srsltid=AfmBOoou_o4_8K8hszRKhrNwGHIQi0AiFRewwf3tT0chGeQsevtOFnp2 */}
                    <Alert severity="error" sx={{marginBottom: '5px'}}>{typeof error === 'string' ? error : error.message || String(error)}</Alert>
            </Grid>}  
            {(hasPermission || isOwner || canProcess) &&
            <>
                {currTransaction.utorid && <TextInput editable={false} field='UTORid' value={currTransaction.utorid} />}
                {currTransaction.createdBy && <TextInput editable={false} field='Created By' value={currTransaction.createdBy} />}
                {currTransaction.relatedId && <TextInput editable={false} 
                    field={currTransaction.type === "adjustment"
                            ? "Related Transaction"
                            : currTransaction.type === "redemption"
                            ? "Processed By"
                            : currTransaction.type === "transfer"
                            ? "Recipient"
                            : currTransaction.type === "event"
                            ? "Event"
                            : "Related To"} 
                        value={currTransaction.relatedId}  />}
                {currTransaction.type && <TextInput editable={false} field='Type' value={currTransaction.type} />}
                {currTransaction.remark && <TextInput editable={false} field='Remark' value={currTransaction.remark} />}
                {currTransaction.spent && <NumberInput editable={false} field='Spent' value={`$${currTransaction.spent}`} />}
                {currTransaction.amount && <NumberInput editable={false} field='Points Earned' value={currTransaction.amount} />}
                {currTransaction.awarded && <NumberInput editable={false} field='Points Awarded' value={currTransaction.awarded} />}
                {currTransaction.sent && <NumberInput editable={false} field='Points Sent' value={currTransaction.sent} />}
            </>}
        </Grid>
        {(hasPermission || isOwner || canProcess) &&
            <>
                <ButtonInputRow>
                <ButtonInput title='Scan QR Code' variant='contained' click={() => handleQRCode()} icon={<QrCode2Icon />} />
                {((hasPermission || canProcess) && currTransaction.type === "redemption") && 
                <>
                    <Button variant='outlined' color="primary"
                        startIcon={currTransaction.relatedId !== null ? <VerifiedIcon /> : <VerifiedOutlinedIcon />}
                        sx={{ 
                            backgroundColor: currTransaction.relatedId !== null ? "#1876d2" : "white",
                            color: currTransaction.relatedId !== null ? "white" : "#1876d2",}}
                        onClick={() => handleToggleProcessed(true)}
                        disabled={currTransaction.relatedId !== null}
                    >
                        {currTransaction.relatedId !== null ? "Processed" : "Unprocessed"}
                    </Button>
                </>}
                {(hasPermission && currTransaction.type === "purchase") && 
                <>
                    <ButtonInput title='Make Adjustment' variant='contained' click={() => setAdjustmentDialogOpen(true)} icon={<EditSharpIcon />} />
                </>}
                {(hasPermission && (currTransaction.type === "purchase" || currTransaction.type === "adjustment")) &&
                <>
                <Button variant='outlined' color="primary"
                        startIcon={currTransaction.suspicious ? <ErrorIcon /> : <ErrorOutlineIcon/>}
                        sx={{ 
                            backgroundColor: currTransaction.suspicious ? "#1876d2" : "white",
                            color: currTransaction.suspicious ? "white" : "#1876d2",}}
                        onClick={() => handleToggleSuspicious(!currTransaction.suspicious)}
                    >
                        {currTransaction.suspicious ? "Suspicious" : "Mark Suspicious"}
                </Button>
                </>}
            </ButtonInputRow>
            </>}
        </>
}