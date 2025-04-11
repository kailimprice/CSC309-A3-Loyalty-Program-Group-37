import React, { useState } from "react";
import Table from "../../components/Table/Table.jsx";
import { ButtonInputRow, ButtonInput, TextInput } from "../../components/Form/Form.jsx";
import { fetchServer } from "../../utils/utils.jsx";

export default function AwardPointsTable({ currEvent, token, setError }) {

    // default to 0, no api to get already awarded points
    // if we do GET transactions and filter, organizers wont be able to see anywasy
    const [awardedPoints, setAwardedPoints] = useState(
        currEvent.guests.reduce((acc, guest) => {
            acc[guest.utorid] = 0; 
            return acc;
        }, {})
    );

    // state for awarding everyone points
    const [pointsForAll, setPointsForAll] = useState(0);

    // handle points change for a specific guest
    const handlePointsChange = (event, utorid) => {
        const value = parseInt(event.target.value, 10) || 0; 
        setAwardedPoints((prev) => ({
            ...prev,
            [utorid]: value,
        }));
    };

    // handle adding points to all guests
    const handlePointsForAllChange = (event) => {
        const value = parseInt(event.target.value, 10) || 0;
        setPointsForAll(value);
    };

    // submit points to the server
    const handleSubmitPoints = async () => {
        try {

            if (pointsForAll > 0) {
                const [response, err] = await fetchServer(`events/${currEvent.id}/transactions`, {
                    method: "POST",
                    headers: new Headers({
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    }),
                    body: JSON.stringify({type: "event", "amount": pointsForAll}),
                });
    
                if (err) {
                    setError(err);
                    console.error("Error awarding points for all:", err);
                    return;
                }
                console.log("Points awarded successfully for all.");
            }

            const updateDetails = Object.entries(awardedPoints).map(([utorid, points]) => ({
                type: "event",
                utorid: utorid,
                amount: parseInt(points, 10) || 0,
            }));
    
            console.log("Submitting points:", updateDetails);
    
            // need to send a seperate req for each
            for (const query of updateDetails) {
                // only send req if points > 0
                if (query.amount > 0) {
                    const [response, err] = await fetchServer(`events/${currEvent.id}/transactions`, {
                        method: "POST",
                        headers: new Headers({
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        }),
                        body: JSON.stringify(query),
                    });
        
                    if (err) {
                        setError(err);
                        console.error("Error awarding points for:", query, err);
                        return;
                    }
                    console.log("Points awarded successfully for:", query);
                }
            }

            console.log("Points awarded successfully.");
            setError(""); 
        } catch (err) {
            setError(err);
            console.error("Error:", err);
        }
    };

    // define table columns
    const columns = {
        utorid: ["Utorid", "text"],
        name: ["Name", "text"],
        points: ["Points", "number", null,  (event, utorid) => handlePointsChange(event, utorid), true],
    };

    // prepare table data
    const data = currEvent.guests.map((guest) => ({
        id: guest.id,
        utorid: guest.utorid,
        name: guest.name,
        points: awardedPoints[guest.utorid], 
    }));

    return (
        <>
            <Table
                columns={columns}
                data={data}
                page={1}
                numPages={1}
                selection={null}
                setSelection={() => {}}
            />
            <ButtonInputRow>
                <TextInput editable={true} field="Award Points to All" value={pointsForAll} changeFunc={handlePointsForAllChange}/>
                <ButtonInput title="Submit Points" variant="contained" click={handleSubmitPoints} disabled={(Object.values(awardedPoints).every((points) => points === 0)) && (pointsForAll === 0)} />
            </ButtonInputRow>
        </>
    );
}