import {useState, useEffect, useRef} from "react";
import {UserService} from "../services/UserService";
import {useToast} from "./useToast.tsx";
import {useAuth} from "./useAuth.tsx";

const useSearchUser = () => {
    const toastRef = useToast();
    const {token} = useAuth();
    const [data, setData] = useState([]);
    const [searchParams, setSearchParams] = useState({name: "", phoneNumber: "", email: "", role: ""});
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(5);
    const [totalItem, setTotalItem] = useState(0);
    const [visibleConnectionError, setVisibleConnectionError] = useState(false);
    const [visibleLoadingConnection, setVisibleLoadingConnection] = useState(false);

    const prevSearchParams = useRef(searchParams);

    useEffect(() => {
        if (JSON.stringify(prevSearchParams.current) !== JSON.stringify(searchParams)) {
            prevSearchParams.current = searchParams;
            if (page != 1){
                setPage(1)
            }else {
                fetchData()
            }
        } else {
            fetchData();
        }
    }, [page, searchParams, size]);

    const fetchData = async (reset = false) => {
        setVisibleConnectionError(false);
        setVisibleLoadingConnection(true);
        try {
            const filters = {
                name: searchParams.name,
                phoneNumber: searchParams.phoneNumber,
                email: searchParams.email,
                role: searchParams.role,
                page: reset ? 1 : page.toString(),
                size: size.toString(),
            };

            const response = await UserService.searchUser(token, filters);

            if (response && response.data) {
                setData(response.data);
                setTotalItem(response.pagination.totalItem);
            }
        } catch (error) {
            if (!error.response) {
                setVisibleConnectionError(true);
            } else {
                toastRef.current.show({severity: "error", detail: error.message});
            }
        }
        setVisibleLoadingConnection(false);
    };


    return {
        data,
        searchParams,
        setSearchParams,
        page,
        setPage,
        size,
        setSize,
        totalItem,
        fetchData,
        visibleConnectionError,
        visibleLoadingConnection,
    };
};

export default useSearchUser;
