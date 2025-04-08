// All users:
//View: all users with filter, pages/infinite scroll
//Filter by name, role. verified, activated, page, limit
//Functionality: manage users
//Need to be able to verify users, make cashier suspicious/not, promote/demote

// Admin:
//View all users?
//Functionality: can promote/demote users

import Typography from '@mui/joy/Typography';
import Table from '../../components/Table/Table.jsx'
import { Card, CardContent, Box, TextField, Button, Grid } from '@mui/material';
import { useState } from 'react'
import { useUserContext } from '../../contexts/UserContext';

export default function Users() {

    const { user, editUserDetails } = useUserContext();

    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [birthday, setBirthday] = useState(user.birthday);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

    const handleSubmit = async () => {
        editUserDetails({
            "name": name, 
            "email": email,
            "birthday": birthday,
            "avatarUrl": avatarUrl
        })
    };
    
    // layout inspired by prev project https://github.com/emily-su-dev/Sinker/blob/main/src/app/components/InfoBox.tsx
    return <>
      <Card>
        <CardContent>
          <h1>Edit Information</h1>
          {/* TODO: make these Grid components instead of Box */}
          <Box display="flex" flexDirection="column" gap={2} width="100%">

            {/* edit name */}
            <Box display="flex" gap={2} flexDirection="row">
              <p>Name</p>
              <TextField
                label="Name"
                variant="outlined"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Box>

            {/* edit email */}
            <Box display="flex" gap={2} flexDirection="row">
              <p>Email</p>
              <TextField
                label="Email"
                variant="outlined"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Box>

            {/* submit button */}
            <div>
              <Button
                variant="contained"
                color="primary"
                sx={{ backgroundColor: '#4467C4' }}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </div>
          </Box>
        </CardContent>
      </Card>     
    </>
}