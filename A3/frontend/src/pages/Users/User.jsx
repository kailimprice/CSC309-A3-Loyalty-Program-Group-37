// Profile:
//View/edit: name, email, birthday, avatar
//Functionality: ability to reset password

import { TextField, Button, Grid, NativeSelect, Checkbox } from '@mui/material';
import { useState, useEffect } from 'react'
import { useUserContext } from '../../contexts/UserContext.jsx';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fetchServer } from '../../utils/utils.jsx';
import { useParams } from 'react-router-dom';
import { FormControl } from '@mui/joy';
import dayjs from 'dayjs';
import { Alert } from '@mui/material'; 

export default function User() {

    const { user, token, setUserDetails } = useUserContext();

    const id = parseInt(useParams().id, 10);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [birthday, setBirthday] = useState(null); 
    const [avatarUrl, setAvatarUrl] = useState("");
    const [verified, setVerified] = useState(false);
    const [suspicious, setSuspicious] = useState(false);
    const [role, setRole] = useState("");
    // error tracking
    const [error, setError] = useState("You do not have permission to edit this user.");


    // get user details for given id
    useEffect(() => {
      // wrap in async to use await
      const getUserDetails = async () => {
        let userDetails;

          // fetch from users/:userId
          const [response, err] = await fetchServer(`users/${id}`, {
            method: "GET",
            headers: new Headers({
              Authorization: `Bearer ${token}`
            })
          })
          if (err) {
            setError(err);
            console.error("Error fetching user details:", err);
            return;
          }
          userDetails = await response.json();

          setName(userDetails.name || "");
          setEmail(userDetails.email || "");
          // need to use dayjs here for datepicker
          setBirthday(userDetails.birthday ? dayjs(userDetails.birthday) : null);
          setAvatarUrl(userDetails.avatarUrl || "");
          // defaulting these to false, i noticed suspicious doesnt have a default
          setVerified(userDetails.verified || false);
          setSuspicious(userDetails.suspicious || false);
          setRole(userDetails.role || "");

          console.log("User details:", userDetails);


          if (id === user.id) {
            // fetch from users/me
            const [response, err] = await fetchServer(`users/me`, {
              method: "GET",
              headers: new Headers({
                Authorization: `Bearer ${token}`
              })
            })
            if (err) {
              setError(err);
              console.error("Error fetching user profile details:", err);
              return;
            }
            let profileDetails = await response.json();

            setName(profileDetails.name);
            setEmail(profileDetails.email);
            // need to use dayjs here for datepicker
            setBirthday(dayjs(userDetails.birthday));

            console.log("Profile details:", userDetails);
          }

          setError("");
      };

      // call func
      getUserDetails();
    }, [id])

    const handleSubmit = async () => {

      if (id === user.id) {
          let updateDetails = {};
          if (name) updateDetails.name = name;
          if (email) updateDetails.email = email;
          // need to convert back to YYYY-MM-DD
          if (birthday) updateDetails.birthday = birthday.format("YYYY-MM-DD");
          if (avatarUrl) updateDetails.avatarUrl = avatarUrl;

          console.log("Updated details being sent:", updateDetails);
          // patch to users/me
          const [response, err] = await fetchServer(`users/me`, {
            method: "PATCH",
            headers: new Headers({
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
          })
          if (err) {
            setError(err);
            console.error("Error patching curent user details:", err);
            return;
          } 

          setUserDetails(updateDetails);
          setError(""); 
      }

      if (user.role === "manager" || user.role === "superuser") {
          let updateDetails = {};
          if (email) updateDetails.email = email;
          // cant checm if (...) since these are bools and react wants them defined
          // i think its okay to edit them anyways bc we always pull their curr val or default
          updateDetails.verified = verified;
          updateDetails.suspicious = suspicious;
          if (role) updateDetails.role = role;

          console.log("Updated details being sent:", updateDetails);
          // patch to users/:userId
          const [response, err] = await fetchServer(`users/${id}`, {
            method: "PATCH",
            headers: new Headers({
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }),
            body: JSON.stringify(updateDetails)
          })
          if (err) {
            setError(err);
            console.error("Error patching user details:", err);
            return;
          }

          if (id === user.id){
            setUserDetails(updateDetails);
          }

          setError(""); 
      }
    };
    
    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    // grid setup inspired by https://mui.com/material-ui/react-grid/
    return <>
          <h1>Edit User Information</h1>
          <Grid container spacing={2} padding={3} alignItems={'center'}>
            {/* display error message if one*/}
            {error && (
                  <Grid size={12}>
                      {/* alerts: https://mui.com/material-ui/react-alert/?srsltid=AfmBOoou_o4_8K8hszRKhrNwGHIQi0AiFRewwf3tT0chGeQsevtOFnp2 */}
                      <Alert severity="error">{error}</Alert>
                  </Grid>
            )}

            {/* if editing own profile */}
            {id === user.id ? (
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

                        {/* edit avatar */}
                        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                            <p>Avatar URL</p>
                        </Grid>
                        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={avatarUrl}
                                onChange={(e) => setAvatarUrl(e.target.value)}
                            />
                        </Grid>

                        {/* edit birthday */}
                        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                            <p>Birthday</p>
                        </Grid>
                        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                value={birthday || null}
                                onChange={(newValue) => setBirthday(newValue)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                            </LocalizationProvider>
                        </Grid>
                    </>
                ): null}

                 {/* to avoid duplicating the email edit box */}
                 {(id === user.id) || (user.role === "manager" || user.role === "superuser") ? (
                    <>
                        {/* edit email */}
                        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                            <p>Email</p>
                        </Grid>
                        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </Grid>
                    </>
                ): null}


                {/* if editing another user's profile as a manager or superuser */}
                {(user.role === "manager" || user.role === "superuser") ? (
                    <>
                        {/* edit verified */}
                        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                            <p>Verified</p>
                        </Grid>
                        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                            <Checkbox
                                checked={verified}
                                onChange={(e) => setVerified(e.target.checked)}
                            />
                        </Grid>

                        {/* edit suspicious */}
                        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                            <p>Suspicious</p>
                        </Grid>
                        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                            <Checkbox
                                checked={suspicious}
                                onChange={(e) => setSuspicious(e.target.checked)}
                            />
                        </Grid>

                        {/* edit role */}
                        <Grid size={{ xs: 5, sm: 5, md: 3 }}>
                            <p>Role</p>
                        </Grid>
                        <Grid size={{ xs: 7, sm: 7, md: 9 }}>
                          <FormControl fullWidth>
                              <NativeSelect
                                  // start off with the lowest role
                                  value={role}
                                  onChange={(e) => setRole(e.target.value)}
                                  inputProps={{
                                  name: 'role',
                                  id: 'uncontrolled-native',
                                  }}
                              >
                                  {/* this can be read as {if && then} */}
                                  {/* roles go lowest -> highest */}
                                  <option value={'regular'}>Regular</option>
                                  <option value={'cashier'}>Cashier</option>
                                  {user.role === 'superuser' && <option value={'manager'}>Manager</option>}
                                  {user.role === 'superuser' && <option value={'superuser'}>Superuser</option>}
                              </NativeSelect>
                          </FormControl>
                        </Grid>
                    </>
                ) : null}

                {!error && (
                  <>
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