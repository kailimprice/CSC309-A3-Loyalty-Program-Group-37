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
        console.log("User update:", localUser);
        return localUser ? JSON.parse(localUser) : null;
    });
    
    const [token, setToken] = useState(() => {
        const localtoken = localStorage.getItem("token");
        return localtoken ? localtoken : null; 
    })

    // when user or token change, store them in local storage
    useEffect(() => {
        console.log("Storing user in localStorage:", user);
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
        console.log("Setting token:", newToken);
        setToken(newToken);
    };

    // destructure curr details and join with updatedDetails
    const editUserDetails = async (updatedDetails) => {
        // update actual data in db
        console.log("details", updatedDetails);
        console.log("token", localStorage.getItem("token"));
        // const [userInfo, e] = await fetchServer('users/me', {
        //     method: 'PATCH',
        //     headers: new Headers({'Authorization': `Bearer ${localStorage.getItem("token")}`}),
        //     body: JSON.stringify(updatedDetails)
        // });
        // if (e) return e;
        // let responseJson = await userInfo.json();
        // setUser(responseJson);

        setUser(updatedDetails);
    };

    return (
        <UserContext.Provider value={{ user, setUserDetails, editUserDetails, setTokenDetails }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUserContext = () => {
    return useContext(UserContext);
};
