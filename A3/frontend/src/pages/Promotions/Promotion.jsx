import { Grid,  } from '@mui/material';
import { useState, useEffect } from 'react'
import { useUserContext } from '../../contexts/UserContext.jsx';
import { fetchServer, hasPerms } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import { Alert } from '@mui/material'; 
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { SpecificHeader, TextInput, NumberInput, DateTimeInput,
    ButtonInput, ButtonInputRow,
    ChoiceInput, } from '../../components/Form/Form.jsx';

export default function Promotion() {

    const { user, token, viewAs } = useUserContext();

    const id = parseInt(useParams().id, 10);
    const navigate = useNavigate();

    const [currPromotion, setCurrPromotion] = useState({});
    const [changes, setChanges] = useState({});

    // error tracking
    const [error, setError] = useState("");

    // perms
    const isManager = hasPerms(viewAs, 'manager');
    const hasPermission = isManager;
    const [isActive, setIsActive] = useState(true);
    
    function makeChange(key) {
        return (event) => {
            let value;
            if (typeof(event) == 'string') {
                value = event;
            } else {
                const type = event.target.type;
                if (type == 'checkbox') {
                    value = event.target.checked;
                } else {
                    value = event.target.value;
                }    
            }

            // convert tp int
            const integerFields = ['minSpending', 'rate', 'points']; 
            if (integerFields.includes(key)) {
                value = parseInt(value, 10) || 0;
            }

            const newChanges = {...changes};
            if (currPromotion[key] == value) {
                delete newChanges[key];
            } else {
                newChanges[key] = value;
            }
            console.log(newChanges);
            setChanges(newChanges);
        }
    }

    async function getPromotionDetails() {
        let promotionDetails;

        const [response, err] = await fetchServer(`promotions/${id}`, {
            method: "GET",
            headers: new Headers({
                Authorization: `Bearer ${token}`
            })
        })
        // this will only error if the promotion does not exist or has not started yet
        if (err) {
            setIsActive(false);
            return setError("You do not have permission to view this promotion.");
        }

        promotionDetails = await response.json();
        setCurrPromotion(promotionDetails);

        console.log("Promotion details:", promotionDetails);
    };

    // get promotion details for given id
    useEffect(() => {
        getPromotionDetails();
    }, [id])


    async function handleSubmit(json) {
        let updateDetails = json;
        const keys = Object.keys(updateDetails);

        console.log("Updated details being sent:", updateDetails);
        // patch to promotions/:id
        const [response, err] = await fetchServer(`promotions/${id}`, {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
        })
        
        if (err) {
            setError(err);
            console.error("Error updating promotion details::", err);
            return;
        } 

        setCurrPromotion((prevPromotion) => ({
            ...prevPromotion,
            updateDetails
        }));

        setError(""); 
        setChanges({});
    };
    
    async function preSubmit() {
        await handleSubmit(changes);
        getPromotionDetails();
    };

    async function handleDelete() {
        try {
            const [response, err] = await fetchServer(`promotions/${id}`, {
                method: "DELETE",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                }),
            });

            if (err) {
                setError(err);
                console.error(`Error deleting promotion`, err);
                return;
            }

            console.log(`Promotion deleted successfully.`);
            navigate('/promotions');
        } catch (err) {
            setError(err);
            console.error("Error:", err);
        }
    };

    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    // Grid setup inspired by https://mui.com/material-ui/react-Grid/
    return <>
       <SpecificHeader display='Promotions' baseUrl='/promotions' id={id} />  
        <Grid container spacing={0} alignItems={'center'}>
            {error && 
            <Grid size={12}>
                {/* alerts: https://mui.com/material-ui/react-alert/?srsltid=AfmBOoou_o4_8K8hszRKhrNwGHIQi0AiFRewwf3tT0chGeQsevtOFnp2 */}
                    <Alert severity="error" sx={{marginBottom: '5px'}}>{typeof error === 'string' ? error : error.message || String(error)}</Alert>
            </Grid>}  

            {isActive && 
            <>
                <NumberInput editable={false} field='ID' value={id} />
                <TextInput editable={hasPermission} field='Name' value={currPromotion.name} changeFunc={makeChange('name')} />
                <TextInput editable={hasPermission} field='Description' value={currPromotion.description} changeFunc={makeChange('description')} />
                
                <ChoiceInput editable={hasPermission} field='Type' value={currPromotion.type} choices={['automatic', 'one-time']} changeFunc={makeChange('type')} />
                {(hasPermission && currPromotion.startTime) && <DateTimeInput editable={hasPermission} field='Start Time' value={currPromotion.startTime} changeFunc={makeChange('startTime')} />}
                <DateTimeInput editable={hasPermission} field='End Time' value={currPromotion.endTime} changeFunc={makeChange('endTime')} />
                {(currPromotion.minSpending || hasPermission) && <NumberInput editable={hasPermission} field='Minimum Spent' value={hasPermission ? currPromotion.minSpending :`$${currPromotion.minSpending}`} changeFunc={makeChange('minSpending')}/>}
                {(currPromotion.rate || hasPermission) && <NumberInput editable={hasPermission} field='Rate' value={hasPermission ? currPromotion.rate :`${currPromotion.rate}x`} changeFunc={makeChange('rate')}/>}
                {(currPromotion.points || hasPermission) && <NumberInput editable={hasPermission} field='Points' value={hasPermission ? currPromotion.points :`$${currPromotion.points}`} changeFunc={makeChange('points')}/>}
            </>}
        </Grid>
        
        {isActive &&
        <>
        <ButtonInputRow>
            {hasPermission && <>
                <ButtonInput title='Update' variant='contained' click={preSubmit} icon={<EditIcon />} disabled={Object.keys(changes).length == 0}/>
                <ButtonInput title='Delete' variant='outlined' click={handleDelete} icon={<DeleteIcon />}/>
            </>}
        </ButtonInputRow>
        </>}
    </>
}