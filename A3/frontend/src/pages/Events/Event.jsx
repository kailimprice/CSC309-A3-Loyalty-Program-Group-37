// Profile:
//View/edit: name, email, birthday, avatar
//Functionality: ability to reset password

import { TextField, Button, Grid, Checkbox, Typography, Stack } from '@mui/material';
import { useState, useEffect } from 'react'
import { useUserContext } from '../../contexts/UserContext.jsx';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fetchServer } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Alert } from '@mui/material'; 
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { SpecificHeader, TextInput, DateInput, NumberInput, BooleanInput, ChoiceInput,
    ButtonInput, ButtonInputRow, UsersInput } from '../../components/Form/Form.jsx';

export default function Event() {

    const id = parseInt(useParams().id, 10);

    const { user, token } = useUserContext();
    const [currEvent, setCurrEvent] = useState({});
    const [error, setError] = useState("");
    const [hasPermission, setHasPermission] = useState(false);
    const [changes, setChanges] = useState({});

    // for nav
    const navigate = useNavigate();
    const baseUrl = `events/${id}`;

    // store non-attendees for dropdown
    const [nonAttendees, setNonAttendees] = useState([]);

    function makeChange(key) {
        console.log(key);
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
            const newChanges = {...changes};
            if (currEvent[key] == value) {
                delete newChanges[key];
            } else {
                newChanges[key] = value;
            }
            console.log(newChanges);
            setChanges(newChanges);
        }
    }

    async function getEventDetails() {
        // fetch from events/:eventId
        const [response, err] = await fetchServer(`events/${id}`, {
            method: "GET",
            headers: new Headers({
                Authorization: `Bearer ${token}`
            })
        })
        if (err) {
            return setError(err);
        }

        const eventDetails = await response.json();
        setCurrEvent(eventDetails);

        // check if user has permission
        const isOrganizer = eventDetails.organizers.some(
            (organizer) => organizer.id === user.id
        );

        setHasPermission(user.role === "manager" || user.role === "superuser" || isOrganizer);

        console.log("currEvent:", currEvent)
        setError("");
    };

    // get event details for given id
    useEffect(() => {
        getEventDetails();
    }, [id])

    async function fetchNonAttendees() {
        if (hasPermission) {
            // fetch users
            const [response, err] = await fetchServer("users", {
                method: "GET",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                }),
            });
            if (err) {
                console.error("Error fetching users:", err);
                return;
            }

            const { results: users } = await response.json();
            const guestIds = currEvent.guests.map((guest) => guest.id);
            const organizerIds = currEvent.organizers.map((organizer) => organizer.id);

            // filter out users who are already guests or organizers
            let retNonAttendees =  users.filter((user) => 
                !guestIds.includes(user.id) && !organizerIds.includes(user.id)
            );

            // pull out only utorids
            retNonAttendees =  retNonAttendees?.map((user) => user.utorid);
            setNonAttendees(retNonAttendees); 
        } 
    }
    
    // refetch non-attendees when guest or organizer changes
    useEffect(() => {
        fetchNonAttendees();
        console.log("currEvent updated:", currEvent);
    }, [currEvent]);


    async function handleSubmit(json) {
            let updateDetails = json;

            console.log("Updated details being sent:", updateDetails);
            // patch to events/:eventId
            const [response, err] = await fetchServer(`events/${id}`, {
                method: "PATCH",
                headers: new Headers({
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                }),
                body: JSON.stringify(updateDetails)
            })
            
            if (err) {
                setError(err);
                console.error("Error updating event details::", err);
                return;
            } 

            setError(""); 
    };
    async function preSubmit() {
        await handleSubmit(changes);
    };

    async function handleRemoveOrganizer(organizerId) {
        try {
            const [response, err] = await fetchServer(`events/${id}/organizers/${organizerId}`, {
                method: "DELETE",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                }),
            });

            if (err) {
                setError(err);
                console.error(`Error removing organizer with ID ${organizerId}:`, err);
                return;
            }

            // remove organizer from state as well to trigger refresh
            makeChange("organizers")(currEvent.organizers.filter((organizer) => organizer.id !== organizerId));

            console.log(`Organizer with ID ${organizerId} removed successfully.`);
        } catch (err) {
            setError(err);
            console.error("Error:", err);
        }
    };

    async function handleRemoveGuest(guestId) {
        try {
            const [response, err] = await fetchServer(`events/${id}/guests/${guestId}`, {
                method: "DELETE",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                }),
            });

            if (err) {
                setError(err);
                console.error(`Error removing guest with ID ${guestId}:`, err);
                return;
            }

            // remove guest from state as well to trigger refresh
            const updatedGuests = currEvent.guests.filter((guest) => guest.id !== guestId);
            setChanges((prevChanges) => ({
                ...prevChanges,
                guests: updatedGuests,
            }));

            console.log(`Guest with ID ${guestId} removed successfully.`);
        } catch (err) {
            setError(err);
            console.error("Error:", err);
        }
    };

    async function handleTogglePublished(published) {
        
        let updateDetails = {};
        // they will be because otherwise you cant see the published button
        if (user.role === "manager" || user.role === "superuser") {
            if (published !== undefined) updateDetails.published = published;
        }

        console.log("Updated details being sent:", updateDetails);
        // patch to events/:eventId
        const [response, err] = await fetchServer(`events/${id}`, {
            method: "PATCH",
            headers: new Headers({
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
        })
        
        if (err) {
            setError(err);
            console.error("Error publishing event:", err);
            return;
        } 

        setCurrEvent((prevEvent) => ({
            ...prevEvent,
            published: published
        }));

        setError(""); 
    };

    async function handleAddGuest(unusedId, utorid) {
        try {
            console.log(nonAttendees);
            // add utorid
            const [response, err] = await fetchServer(`events/${id}/guests`, {
                method: "POST",
                headers: new Headers({
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                }),
                body: JSON.stringify({ utorid }),
            });

            if (err) {
                setError(err);
                console.error(`Error adding guest with UTORID ${utorid}:`, err);
                return;
            }

            const newGuest = await response.json();
            // destructure and add new guest
            const updatedGuests = [...(changes.guests || currEvent.guests), newGuest];
            setChanges((prevChanges) => ({
                ...prevChanges,
                guests: updatedGuests,
            }));

            console.log(`Guest with UTORID ${utorid} added successfully.`);
        } catch (err) {
            setError(err);
            console.error("Error:", err);
        }
    };

    async function handleAddOrganizer(unusedId, utorid) {
        try {
            console.log(nonAttendees);
            // add utorid
            const [response, err] = await fetchServer(`events/${id}/organizers`, {
                method: "POST",
                headers: new Headers({
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                }),
                body: JSON.stringify({ utorid }),
            });

            if (err) {
                setError(err);
                console.error(`Error adding organizer with UTORID ${utorid}:`, err);
                return;
            }

            const newOrganizer = await response.json();
            // destructure and add new guest
            const updatedOrganizers = [...(changes.organizers || currEvent.organizers), newOrganizer];
            setChanges((prevChanges) => ({
                ...prevChanges,
                organizers: updatedOrganizers,
            }));

            console.log(`Organizer with UTORID ${utorid} added successfully.`);
        } catch (err) {
            setError(err);
            console.error("Error:", err);
        }
    };


    async function handleDelete() {
        try {
            const [response, err] = await fetchServer(`events/${id}`, {
                method: "DELETE",
                headers: new Headers({
                    Authorization: `Bearer ${token}`,
                }),
            });

            if (err) {
                setError(err);
                console.error(`Error deleting event`, err);
                return;
            }

            console.log(`Event deleted successfully.`);
            navigate('/events');
        } catch (err) {
            setError(err);
            console.error("Error:", err);
        }
    };

    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    // Grid setup inspired by https://mui.com/material-ui/react-Grid/
    return <>
        <SpecificHeader display='Events' baseUrl='/events' id={id} />    
        <Grid container spacing={0} alignItems={'center'}>
            {error && 
            <Grid size={12}>
                {/* alerts: https://mui.com/material-ui/react-alert/?srsltid=AfmBOoou_o4_8K8hszRKhrNwGHIQi0AiFRewwf3tT0chGeQsevtOFnp2 */}
                    <Alert severity="error" sx={{marginBottom: '5px'}}>{typeof error === 'string' ? error : error.message || String(error)}</Alert>
            </Grid>}
            
            <NumberInput editable={false} field='ID' value={id} />
            <TextInput editable={hasPermission} field='Name' value={currEvent.name} changeFunc={makeChange('name')} />
            <TextInput editable={hasPermission} field='Description' value={currEvent.description} changeFunc={makeChange('description')} />
            <TextInput editable={hasPermission} field='Location' value={currEvent.location} changeFunc={makeChange('location')} />
            <DateInput editable={hasPermission} field='Start Time' value={currEvent.startTime} changeFunc={makeChange('startTime')} />
            <DateInput editable={hasPermission} field='End Time' value={currEvent.endTime} changeFunc={makeChange('endTime')} />
            <NumberInput editable={hasPermission} field='Capacity' value={currEvent.capacity} changeFunc={makeChange('capacity')}/>
            <UsersInput editable={hasPermission} field="Organizers" users={currEvent.organizers} choices={nonAttendees} handleRemoveUser={handleRemoveOrganizer} handleAddUser={handleAddOrganizer} currentUser={user}/>
            <NumberInput editable={hasPermission} field='Number of Guests' value={currEvent.numGuests} changeFunc={makeChange('numGuests')}/>
            <UsersInput editable={hasPermission} field="Guests" users={currEvent.guests} choices={nonAttendees} handleRemoveUser={handleRemoveGuest} handleAddUser={handleAddGuest} currentUser={user}/>

            {hasPermission && 
            <>
                <p></p>
            
            </>}
        </Grid>
        <ButtonInputRow>
            <ButtonInput title='Update' variant='contained' click={preSubmit} icon={<EditIcon />} disabled={Object.keys(changes).length == 0}/>
            {hasPermission &&
            <ButtonInput title='Delete' variant='outlined' click={handleDelete} icon={<DeleteIcon />}  disabled={user.role !== "manager" || user.role !== "superuser"}/>}
        </ButtonInputRow>

    </>
}