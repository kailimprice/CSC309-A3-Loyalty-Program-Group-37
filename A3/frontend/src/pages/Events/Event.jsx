// Profile:
//View/edit: name, email, birthday, avatar
//Functionality: ability to reset password

import { TextField, Button, Grid, Checkbox } from '@mui/material';
import { useState, useEffect } from 'react'
import { useUserContext } from '../../contexts/UserContext.jsx';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fetchServer } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { Alert } from '@mui/material'; 
import ButtonTag from '../../components/Button/ButtonTag.jsx';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate } from 'react-router-dom';


export default function Event() {

const { user, token } = useUserContext();
const navigate = useNavigate();

const id = parseInt(useParams().id, 10);

const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [location, setLocation] = useState("");
const [startTime, setStartTime] = useState(null);
const [endTime, setEndTime] = useState(null);
const [capacity, setCapacity] = useState(null);
const [points, setPoints] = useState(null);
const [published, setPublished] = useState(false);
const [organizers, setOrganizers] = useState([]);
const [guests, setGuests] = useState([]);
// error tracking
const [error, setError] = useState("");
const [permission, setPermission] = useState(false);
// store non-attendees for dropdown
const [nonAttendees, setNonAttendees] = useState([]);


// get event details for given id
useEffect(() => {
    // wrap in async to use await
    const geteventDetails = async () => {
    let eventDetails;

    // fetch from events/:eventId
    const [response, err] = await fetchServer(`events/${id}`, {
        method: "GET",
        headers: new Headers({
            Authorization: `Bearer ${token}`
        })
    })
    if (err) {
        setError(err);
        console.error("Error fetching event details:", err);
        return;
    }

    eventDetails = await response.json();

    // check if user has permission
    const isOrganizer = eventDetails.organizers.some(
        (organizer) => organizer.id === user.id
    );

    const hasPermission = user.role === "manager" || user.role === "superuser" || isOrganizer;

    if (!hasPermission) {
        setError("You do not have permission to view this event.");
        console.error("Permission denied: User cannot edit this event.");
        return;
    }

    setName(eventDetails.name || "");
    setDescription(eventDetails.description || "");
    setLocation(eventDetails.location || "");
    setStartTime(eventDetails.startTime ? dayjs(eventDetails.startTime) : null);
    setEndTime(eventDetails.endTime ? dayjs(eventDetails.endTime) : null);
    setCapacity(eventDetails.capacity !== undefined ? eventDetails.capacity : null);
    setPoints(eventDetails.pointsRemain !== undefined ? eventDetails.pointsRemain + eventDetails.pointsAwarded : null);
    setPublished(eventDetails.published || false);
    setOrganizers(eventDetails.organizers || []);
    setGuests(eventDetails.guests || []);

    console.log("Event details:", eventDetails);

    setPermission(true);
    };

    // call func
    geteventDetails();
}, [id])

// refetch non-attendees when guest or organizer changes
useEffect(() => {
    // async to use await
    const fetchNonAttendees = async () => {
        const retNonAttendees = await getNonAttendees();
        setNonAttendees(retNonAttendees); 
    };

    fetchNonAttendees();
}, [guests, organizers]); 

const getNonAttendees = async () => {
    // fetch users
    const [response, err] = await fetchServer("users", {
        method: "GET",
        headers: new Headers({
            Authorization: `Bearer ${token}`,
        }),
    });

    if (err) {
        console.error("Error fetching users:", err);
        return [];
    }

    const { results: users } = await response.json();

    const guestIds = guests.map((guest) => guest.id);
    const organizerIds = organizers.map((organizer) => organizer.id);

    // filter out users who are already guests or organizers
    let nonAttendees =  users.filter((user) => 
        !guestIds.includes(user.id) && !organizerIds.includes(user.id)
    );

    // pull out only utorids
    nonAttendees =  nonAttendees.map((user) => user.utorid);

    console.log(nonAttendees);
    return nonAttendees;
};

const handleSubmit = async () => {
        let updateDetails = {};
        if (name) updateDetails.name = name;
        if (description) updateDetails.description = description;
        if (location) updateDetails.location = location;
        if (startTime) updateDetails.startTime = startTime.toISOString();
        if (endTime) updateDetails.endTime = endTime.toISOString();
        if (capacity !== undefined) updateDetails.capacity = capacity;
        if (user.role === "manager" || user.role === "superuser") {
            if (points !== undefined) updateDetails.points = points;
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
            console.error("Error updating event details::", err);
            return;
        } 

        setError(""); 
};

const handleRemoveOrganizer = async (organizerId) => {
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
        setOrganizers((prevOrganizers) =>
            prevOrganizers.filter((organizer) => organizer.id !== organizerId)
        );

        console.log(`Organizer with ID ${organizerId} removed successfully.`);
    } catch (err) {
        setError(err);
        console.error("Error:", err);
    }
};

const handleRemoveGuest = async (guestId) => {
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

        // remove organizer from state as well to trigger refresh
        setOrganizers((prevGuests) =>
            prevGuests.filter((guest) => guest.id !== guestId)
        );

        console.log(`Guest with ID ${guestId} removed successfully.`);
    } catch (err) {
        setError(err);
        console.error("Error:", err);
    }
};

const handleTogglePublished = async (published) => {
    
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

    setPublished(published);

    setError(""); 
};

const handleAddGuest = async (unusedId, utorid) => {
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
        setGuests((prevGuests) => [...prevGuests, newGuest]); 
        console.log(`Guest with UTORID ${utorid} added successfully.`);
    } catch (err) {
        setError(err);
        console.error("Error:", err);
    }
};

const handleAddOrganizer = async (unusedId, utorid) => {
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
        setOrganizers((prevOrganizers) => [...prevOrganizers, newOrganizer]); 
        console.log(`Organizer with UTORID ${utorid} added successfully.`);
    } catch (err) {
        setError(err);
        console.error("Error:", err);
    }
};


const handleDelete = async () => {
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
        <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h1>Event {id}</h1>
            {(permission && (user.role === "manager" || user.role === "superuser")) &&
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ 
                        backgroundColor: published ? "#4467C4" : "white",
                        color: published ? "white" : "#4467C4",
                        // lighter shade
                        "&:hover": {
                            backgroundColor: published ? "#365a9d" : "#f0f0f0", 
                        }, 
                        width: "200px",
                        display: "flex",
                        justifyContent: "center",
                        gap: "8px" }}
                        // published can only be set to true
                    onClick={() => handleTogglePublished(true)}
                >
                    {published ? <VisibilityIcon /> : <VisibilityOffIcon/>}
                    {published ? "Published" : "Unpublished"}
                </Button>
            }
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
            {/* edit name */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Name</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </Grid>

            {/* edit description */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Description</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    // allow multiline text (maybe desc is long?)
                    multiline
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </Grid>

            {/* edit location */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Location</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </Grid>

            {/* edit organizers */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Organizers</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <div style={{ gap:"0.3rem", display: "flex"}}>
                {organizers.map((organizer) => (
                    <ButtonTag
                        key={organizer.id}
                        value={organizer.utorid}
                        options={"deletable"}
                        changeFunc={(unusedId, utorid) => handleRemoveOrganizer(unusedId, utorid)}
                        type={`tag-${organizer.role}`}
                        id={organizer.id}
                    />
                ))}
                {/* add org button */}
                <ButtonTag
                    key={1000}
                    value={"+"}
                    options={nonAttendees}
                    changeFunc={(unusedId, utorid) => handleAddOrganizer(unusedId, utorid)}
                    type="tag-add"
                    id={1000}
                />
            </div>
            </Grid>

            {/* edit start time */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Start Time</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    value={startTime || null}
                    onChange={(newValue) => setStartTime(newValue)}
                    renderInput={(params) => <TextField {...params} />}
                />
                </LocalizationProvider>
            </Grid>

            {/* edit guests */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Guests</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
            <div style={{ gap:"0.3rem", display: "flex"}}>
                {guests.map((guest) => (
                    <ButtonTag
                        key={guest.id}
                        value={guest.utorid}
                        options={"deletable"}
                        changeFunc={() => handleRemoveGuest(guest.id)}
                        type={`tag-${guest.role}`}
                        id={guest.id}
                    />
                ))}
                {/* add guest button */}
                <ButtonTag
                    key={"add"}
                    value={"+"}
                    options={nonAttendees}
                    changeFunc={(selectedValue) => handleAddGuest(selectedValue)}
                    type="tag-add"
                    id={"add"}
                />
            </div>
            </Grid>

            {/* edit end time */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>End Time</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                    value={endTime || null}
                    onChange={(newValue) => setEndTime(newValue)}
                    renderInput={(params) => <TextField {...params} />}
                />
                </LocalizationProvider>
            </Grid>

            {/* edit capacity */}
            <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                <p>Capacity</p>
            </Grid>
            <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    // numeric
                    type="number"
                    value={capacity || ""}
                    // need to parse
                    onChange={(e) => setCapacity(e.target.value ? parseInt(e.target.value, 10) : null)}
                />
            </Grid>

            {/* if editing points or published */}
            {(user.role === "manager" || user.role === "superuser") ? (
                <>
                    {/* edit points */}
                    <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                        <p>Points</p>
                    </Grid>
                    <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            // numeric
                            type="number"
                            value={points || ""}
                            // need to parse
                            onChange={(e) => setPoints(e.target.value ? parseInt(e.target.value, 10) : null)}
                        />
                    </Grid>

                    {/* edit published */}
                    <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                        <p>Published</p>
                    </Grid>
                    <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                        <Checkbox
                            checked={published}
                            onChange={(e) => setPublished(e.target.checked)}
                        />
                    </Grid>

                </>
            ) : null}

            {/* submit */}
            <Grid size={12}>
                <div style={{ gap:"1rem", display: "flex"}}>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ 
                        backgroundColor: "#4467C4",
                        // lighter shade
                        "&:hover": {
                            backgroundColor: published ? "#f0f0f0" : "#365a9d", 
                        }, 
                    }}
                    onClick={handleSubmit}
                >
                    Update
                </Button>
                {(user.role === "manager" || user.role === "superuser") &&
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ 
                            backgroundColor: "#ff0000",
                            // darker shade
                            "&:hover": {
                                backgroundColor: "#c50000", 
                            }, 
                        }}
                        onClick={handleDelete}
                    >
                        Delete
                    </Button>
                }
                </div>
            </Grid>
            </>
        )}
        </Grid> 
    </>
}