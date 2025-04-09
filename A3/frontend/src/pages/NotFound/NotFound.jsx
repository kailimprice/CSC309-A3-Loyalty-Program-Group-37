//404 Not Found page

import {Stack, Box, Typography} from '@mui/material';


export default function NotFound() {
    return <Stack width='100%' height='100%' direction='column' sx={{alignItems: 'center', justifyContent: 'center'}}>
        <Box>
            <Typography variant='h2' align='center' sx={{fontWeight: 'bold'}}>Error...</Typography>
            <Typography variant='subtitle1' align='center'>The requested page could not be displayed.</Typography>
        </Box>
    </Stack>
}