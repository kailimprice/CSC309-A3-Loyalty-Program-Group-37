import React, { useState, useEffect } from "react";
import { Box, Stack, Typography, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions, Button,Tabs,Tab, Chip} from "@mui/material";
import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import { format } from "date-fns";
import { Event, LocalOffer } from "@mui/icons-material";
import { useUserContext } from "../../contexts/UserContext.jsx";
import { fetchServer } from "../../utils/utils";

// determine whether a timeline item is past, upcoming, or active
const getStatus = (item, now) => {
    if (now > item.end) return "Completed";
    if (now < item.start) return "Upcoming";
    return "Active";
};

export default function Dashboard() {
    const [items, setItems] = useState([]);           // state for items
    const [selected, setSelected] = useState(null);   // state for selected item in dialog
    const [open, setOpen] = useState(false);          // state to control dialog visibility
    const [tab, setTab] = useState(0);                // state to track current tab selection

    const now = new Date();               // current timestamp
    const { token } = useUserContext();   // get user context

    useEffect(() => {
        const getTimelineDetails = async () => {
            // fetch from events
            let [response1, error1] = await fetchServer(`events`, {
                    method: "GET",
                    headers: new Headers({
                    Authorization: `Bearer ${token}`,
                }),
            });
            if (error1) {
                console.error("Error fetching events:", error1);
                return;
            }
            const { results: eventDetails } = await response1.json();


            // fetch from promotions
            let [response2, error2] = await fetchServer(`promotions`, {
                method: "GET",
                headers: new Headers({
                Authorization: `Bearer ${token}`,
                }),
            });
            if (error2) {
                console.error("Error fetching events:", error2);
                return;
            }
            const { results: promotionDetails } = await response2.json();

            const combined = [
                ...eventDetails.map((e) => ({
                    id: e.id,
                    type: "Event",
                    title: e.name,
                    description: e.description,
                    start: new Date(e.startTime),
                    end: new Date(e.endTime),
                    // storing not shared val in a misc attribute
                    misc: e.location,
                })),
                    ...promotionDetails.map((p) => ({
                    id: p.id,
                    type: "Promotion",
                    title: p.name,
                    description: p.description,
                    start: new Date(p.startTime),
                    end: new Date(p.endTime),
                    // storing not shared val in a misc attribute
                    misc: p.type,
                })),
            ];
            setItems(combined);
        };
        getTimelineDetails();
    }, []);

    // open dialog and set selected item
    const handleClick = (item) => {
        setSelected(item);
        setOpen(true);
    };

    // close dialog
    const handleClose = () => {
        setOpen(false);
    };

    // handle tab switching
    const handleTab = (e, val) => {
        setTab(val);
    };

    // inspired by https://mui.com/material-ui/react-timeline/?srsltid=AfmBOoq-7_v3wuE5l0W7FE6nrl43lddhGrCKH6yn1RvqNPgxwLGIh1gg#customization
    return <>
        {/* section header */}
        <Typography variant='body1' className='body-header'>
            Dashboard
        </Typography>
        
        {/* filter tabs to show all/events/promotions */}
        <Stack direction='row' sx={{justifyContent: 'center'}}>
            <Tabs value={tab} onChange={handleTab}>
                <Tab label="all" />
                <Tab label="events" />
                <Tab label="promotions" />
            </Tabs>
        </Stack>
            

        {/* timeline */}
        <Timeline>
            {items
            // sort for least recent first
            .sort((a, b) => {
                const diff = new Date(a.start) - new Date(b.start);
                if (diff == 0)
                    return new Date(a.end) - new Date(b.end);
                return diff;
            })
            // filter timeline items by selected tab
            // true if tab is 0 or if item.type = curr tab
            .filter(
                (item) =>
                tab === 0 || item.type === (tab === 1 ? "Event" : "Promotion")
            )
            .map((item, idx, arr) => {
                const status = getStatus(item, now);
                // need a unique key since we join events and promotions
                const uniqueKey = `${item.type}-${item.id}`;
                return (
                    // if index is divisible by 2, alternate (every other left / right)
                    <TimelineItem key={uniqueKey} position={idx % 2 === 0 ? 'left' : 'right'}>
                        <TimelineSeparator>
                            {/* dot shows type and status color - success is green, primary is blue */}
                            <TimelineDot color={ status === "Active" ? "success" : status === "Upcoming" ? "primary" : "grey"}>
                                {/* choose event or price tag icon */}
                                {item.type === "Event" ? <Event /> : <LocalOffer />}
                            </TimelineDot>
                            {/* add a connect to next item if not last */}
                            {idx < arr.length - 1 && <TimelineConnector />}
                        </TimelineSeparator>
                        
                        <TimelineContent>
                            {/* card with item info */}
                            <Card onClick={() => handleClick(item)} sx={{ mb: 1, cursor: "pointer" }}>
                                <CardContent>
                                    {/* title */}
                                    <Typography variant="subtitle1">{item.title}</Typography>
                                    {/* description - text.secondary makes it lighter !*/}
                                    <Typography variant="body2" color="text.secondary">
                                        {item.description}
                                    </Typography>
                                    {/* date range - errors out without format: https://date-fns.org/docs/format */}
                                    <Typography variant="caption"> 
                                        {format(item.start, "h:mm a, d MMM y")} –{" "} {format(item.end,  "h:mm a, d MMM y")}
                                    </Typography>
                                    {/* type and status tags */}
                                    <Box mt={1} display="flex" gap={1} sx={{justifyContent: idx % 2 === 0 ? 'flex-end' : 'flex-start'}}>
                                        <Chip label={item.type} size="small"  />
                                        <Chip label={status} size="small" />
                                    </Box>
                                </CardContent>
                            </Card>
                        </TimelineContent>
                    </TimelineItem>
                );
            })}
        </Timeline>

        {/* dialog with selected item details */}
        <Dialog open={open} onClose={handleClose}>
            {selected && (
            <>
                {/* item title */}
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogContent>
                {/* item description */}
                <Typography>{selected.description}</Typography>
                {/* date range - errors out without format: https://date-fns.org/docs/format */}
                <Typography variant="body2" color="text.secondary">
                    {format(selected.start, "MMM d, h:mm a")} -{" "} {format(selected.end,  "MMM d, h:mm a")}
                </Typography>
                {/* misc details */}
                <Typography variant="body2" sx={{ mt: 2 }}>
                    {selected.misc}
                </Typography>
                </DialogContent>
                <DialogActions>
                {/* close dialog button */}
                <Button onClick={handleClose}>close</Button>
                </DialogActions>
            </>
            )}
        </Dialog>
    </>;
}
