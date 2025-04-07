import Typography from "@mui/joy/Typography";
import { Box } from '@mui/material'

const Footer = () => {
    return (
        <Box component='footer'>
            <Typography level="body-md" sx={{color: 'white'}}>
                &copy;CSC309, Winter 2025, Bahen Center for Information Technology.
            </Typography>
        </Box>
    )
        
}

export default Footer;