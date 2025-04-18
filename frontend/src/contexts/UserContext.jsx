// inspired by t10 CityContext
// there is no restriction to what can be stored in here
// UPDATE: removed editUserDetails
//
// to use:
//   1. import { useUserContext } from '../../contexts/UserContext';
//   2. inside function: const { user, token, setUserDetails } = useUserContext();
//   3. usage:
//        * retrieve attributes: (user.role, user.name, etc.)
//        * retrieve tokenL {token}
//        * set attributes: setUserDetails({ key: val }) 

import { createContext, useContext, useState, useEffect } from "react";
import { fetchServer } from "../utils/utils";

const UserContext = createContext();

// store in local storage everytime we update and pull on refresh
// https://medium.com/@Fbnjnkr/save-a-react-context-state-after-reloading-the-page-what-i-learned-in-week-16-2023-554959e80ded
export const UserProvider = ({ children }) => {
    // when we refresh, the context goes away
    // upon every change to user or token, pull from local storage if exists
    const [user, setUser] = useState(() => {
        const localUser = localStorage.getItem("user");
        // console.log("User update:", localUser);
        return localUser ? JSON.parse(localUser) : null;
    });
    
    const [token, setToken] = useState(() => {
        const localtoken = localStorage.getItem("token");
        return localtoken ? localtoken : null; 
    })

    // when user or token change, store them in local storage
    useEffect(() => {
        // console.log("Storing user in localStorage:", user);
        if (user) {
            localStorage.setItem("user", JSON.stringify(user));
        } else {
            localStorage.removeItem("user");
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            localStorage.setItem("token", token)
        } else {
            localStorage.removeItem("token");
        }
    }, [token]);

    // only overwrite neccessary details
    const setUserDetails = (newUserDetails) => {
        setUser((currUserDetails) => ({
            ...currUserDetails,
            ...newUserDetails,
        }));
    };

    // only overwrite neccessary details
    const setTokenDetails = (newToken) => {
        // console.log("Setting token:", newToken);
        setToken(newToken);
    };

    const [viewAs, setViewAs] = useState(user ? user.role : null);

    // setupdateDisplay is called in the side bar after a request is made
    // in /users, /transactions, etc., the change to updateDisplay is used as a effect to reload the data 
    const [updateDisplay, setUpdateDisplay] = useState(false);
    const [relatedIdDesc, setRelatedIdDesc] = useState('');

    return (
        <UserContext.Provider value={{ user, token, setUserDetails, setTokenDetails, viewAs, setViewAs, updateDisplay, setUpdateDisplay, relatedIdDesc, setRelatedIdDesc }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};
