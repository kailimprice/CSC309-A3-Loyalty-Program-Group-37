// inspired by t10 CityContext
// there is no restriction to what can be stored in here
//
// to use:
//   1. import { useUserContext } from '../../contexts/UserContext';
//   2. inside function: const { user, setUserDetails, editUserDetails } = useUserContext();
//   3. usage:
//        * retrieve attributes: (user.role, user.name, etc.)
//        * set attributes: setUserDetails({ key: val }) 
//        * update attributes: updatedDetails({ key: val })

import { createContext, useContext, useState } from "react";
import avatar from "../assets/avatar.png";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    // this will be implemented soon, for testing sake made a hardcode
    // const [user, setUser] = useState(null);
    const [user, setUser] = useState(
        { id: 1, name: "Clive", utorid: "clive123", role: "superuser", avatarUrl: avatar }
    );

    const setUserDetails = (userDetails) => {
        setUser(userDetails);
    };

    // destructure curr details and join with updatedDetails
    const editUserDetails = (updatedDetails) => {
        setUser((currDetails) => ({
            ...currDetails,
            ...updatedDetails
        }));
    };

    return (
        <UserContext.Provider value={{ user, setUserDetails, editUserDetails }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};
