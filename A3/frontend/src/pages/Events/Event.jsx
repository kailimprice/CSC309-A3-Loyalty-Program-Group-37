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

export default function Event() {

const { user, token } = useUserContext();

const id = parseInt(useParams().id, 10);

const [name, setName] = useState("");
const [description, setDescription] = useState("");
const [location, setLocation] = useState("");
const [startTime, setStartTime] = useState(null);
const [endTime, setEndTime] = useState(null);
const [capacity, setCapacity] = useState(null);
const [points, setPoints] = useState(null);
const [published, setPublished] = useState(false);
// error tracking
const [error, setError] = useState("");
const [permission, setPermission] = useState(false);


// get event details for given id
useEffect(() => {
    // wrap in async to use await
    const geteventDetails = async () => {
    let eventDetails;

    // fetch from events/:eventId
    const [response, error] = await fetchServer(`events/${id}`, {
        method: "GET",
        headers: new Headers({
            Authorization: `Bearer ${token}`
        })
    })
    if (error) {
        setError(error);
        console.error("Error fetching event details:", error);
        return;
    }

    eventDetails = await response.json();

    // check if user has permission
    const isOrganizer = eventDetails.organizers.some(
        (organizer) => organizer.id === user.id
    );

    const hasPermission = user.role === "manager" || user.role === "superuser" || isOrganizer;

    if (!hasPermission) {
        setError("You do not have permission to edit this event.");
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

    console.log("Event details:", eventDetails);

    setPermission(true);
    };

    // call func
    geteventDetails();
}, [id])

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
        const [response, error] = await fetchServer(`events/${id}`, {
        method: "PATCH",
        headers: new Headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        }),
        body: JSON.stringify(updateDetails)
        })
        
        if (error) {
        setError(error);
        console.error("Error updating event details::", error);
        return;
        } 

        setError(""); 
};

// layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
// Grid setup inspired by https://mui.com/material-ui/react-Grid/
return <>
        <h1>Edit Event Information</h1>
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
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ backgroundColor: "#4467C4" }}
                    onClick={handleSubmit}
                >
                    Submit
                </Button>
            </Grid>
            </>
        )}
        </Grid> 
    </>
}