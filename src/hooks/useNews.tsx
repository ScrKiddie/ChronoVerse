import {useState, useEffect, useRef} from "react";
import {useLocation, useNavigate, useParams} from "react-router-dom";
import {Menu} from "primereact/menu";
import {PostService} from "../services/PostService";
import {CategoryService} from "../services/CategoryService";
import {useUpdatePost} from "./useUpdatePost.tsx";

const getRelativeTime = (timestamp: number) => {
    const now = new Date();
    const past = new Date(timestamp * 1000);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} tahun lalu`;
    if (months > 0) return `${months} bulan lalu`;
    if (weeks > 0) return `${weeks} minggu lalu`;
    if (days > 0) return `${days} hari lalu`;
    if (hours > 0) return `${hours} jam lalu`;
    if (minutes > 0) return `${minutes} menit lalu`;

    return "Baru saja";
};

const truncateText = (text, maxLength) => {
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};

const formatDate = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);

    const formattedDate = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).replace(".", "");

    const formattedTime = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).replace(".", ":");

    return `${formattedDate}, ${formattedTime}`;
};

const useNews = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [activeIndex, setActiveIndex] = useState(-1);
    const [searchQuery, setSearchQuery] = useState("");

    const [headlineNews, setHeadlineNews] = useState(null);
    const [topNews, setTopNews] = useState([]);
    const [news, setNews] = useState([]);
    const [searchNews, setSearchNews] = useState([]);

    const [headlinePage, setHeadlinePage] = useState(1);
    const [topNewsPage, setTopNewsPage] = useState(1);
    const [newsPage, setNewsPage] = useState(1);
    const [searchNewsPage, setSearchNewsPage] = useState(1);

    const [headlinePagination, setHeadlinePagination] = useState({totalItem: 0, totalPage: 1});
    const [topNewsPagination, setTopNewsPagination] = useState({totalItem: 0, totalPage: 1});
    const [newsPagination, setNewsPagination] = useState({totalItem: 0, totalPage: 1});
    const [searchNewsPagination, setSearchNewsPagination] = useState({totalItem: 0, totalPage: 1});

    const headlineSize = 1;
    const topNewsSize = 3;
    const newsSize = 5;
    const searchNewsSize = 5

    const menuRef = useRef<Menu>(null);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const token = localStorage.getItem("token");

    const [headlineMode, setHeadlineMode] = useState(false);

    const [post, setPost] = useState({
        id: null,
        category: {
            id: null,
            name: ""
        },
        user: {
            id: null,
            name: "",
            profilePicture: ""
        },
        title: "",
        summary: "",
        content: "",
        publishedDate: null,
        lastUpdated: null,
        thumbnail: ""
    });

    const [notFound, setNotFound] = useState(false);
    const [retry, setRetry] = useState(0);
    const handleRetry = () => {
        setRetry(prevRetry => prevRetry + 1);
    };


    useEffect(() => {
        const handleScroll = (event: Event) => {
            menuRef.current?.hide(event);
        };

        window.addEventListener("scroll", handleScroll);
        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);


    const fetchCategories = async () => {
        setError(false)
        setLoading(true)
        try {
            const response = await CategoryService.listCategories(token);
            if (Array.isArray(response.data)) {
                setCategories(response.data);
            }
        } catch (error) {
            if (!error.response) {
                setError(true)
            } else {
                console.log(error)
            }
        } finally {
            setLoading(false)
        }
    };

    const fetchHeadlineNews = async (category = "") => {
        setLoading(true);
        setError(false)
        try {
            const filters = {
                categoryName: category !== "Home" && category !== "home" ? category : "",
                page: headlinePage,
                size: headlineSize,
            };

            const response = await PostService.searchPost(token, filters);
            const {data, pagination} = response;

            setHeadlineNews(data.length > 0 ? {
                ...data[0],
                publishedDate: getRelativeTime(data[0].publishedDate)
            } : null);

            setHeadlinePagination(pagination);
        } catch (error) {
            if (!error.response) {
                console.log(error)
                setError(true)
            } else {
                console.log(error)
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchSearchNews = async (query = "", category = "") => {
        setLoading(true);
        setError(false);

        try {
            const filters = {
                title: query,
                categoryName: query,
                userName: query,
                summary: query,
                page: searchNewsPage,
                size: searchNewsSize,
            };

            const response = await PostService.searchPost(token, filters);
            const {data, pagination} = response;

            setSearchNews(data.map(item => ({
                ...item,
                publishedDate: getRelativeTime(item.publishedDate),
            })));

            setSearchNewsPagination(pagination);
        } catch (error) {
            if (!error.response) {
                console.log(error)
                setError(true)
            } else {
                console.log(error)
            }
        } finally {
            setLoading(false);
        }
    };


    const fetchTopNews = async (category = "") => {
        setError(false)
        setLoading(true);
        try {
            const filters = {
                categoryName: category !== "Home" && category !== "home" ? category : "",
                page: topNewsPage,
                size: topNewsSize,
            };

            const response = await PostService.searchPost(token, filters);
            const {data, pagination} = response;
            setTopNews(data.map(item => ({
                ...item,
                publishedDate: getRelativeTime(item.publishedDate)
            })));
            setTopNewsPagination(pagination);
        } catch (error) {
            if (!error.response) {
                console.log(error)
                setError(true)
            } else {
                console.log(error)
            }
        } finally {
            setLoading(false)
        }
    };

    const fetchNews = async (category = "") => {
        setLoading(true);
        setError(false);

        try {
            const filters = {
                categoryName: category !== "Home" && category !== "home" ? category : "",
                page: newsPage,
                size: newsSize,
            };

            const response = await PostService.searchPost(token, filters);
            const {data, pagination} = response;
            setNews(data.map(item => ({
                ...item,
                publishedDate: getRelativeTime(item.publishedDate)
            })));
            setNewsPagination(pagination);
        } catch (error) {
            if (!error.response) {
                console.log(error)
                setError(true)
            } else {
                console.log(error)
            }
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchCategories();
    }, [retry]);


    const {id} = useParams();
    const {processContent} = useUpdatePost();
    const [searchMode, setSearchMode] = useState(true)

    useEffect(() => {
        if (headlineMode && !searchMode && selectedCategory != "") {
            fetchHeadlineNews(selectedCategory);
        }
}, [selectedCategory, headlinePage, headlineMode, retry, searchMode]);

    useEffect(() => {
        if (!searchMode && selectedCategory != "") {
            fetchTopNews(selectedCategory);
        }
    }, [selectedCategory, topNewsPage, retry, searchMode]);

    useEffect(() => {
        if (!searchMode && selectedCategory != "") {
            fetchNews(selectedCategory);
        }
    }, [selectedCategory, newsPage,retry, searchMode]);

    const getQueryFromUrl = () => {
        if (window.location.pathname === '/post') {
            const params = new URLSearchParams(window.location.search);
            return params.get('id') || '';
        }else if (window.location.pathname === '/search') {
            const params = new URLSearchParams(window.location.search);
            return params.get('q') || '';
        }
        return '';
    };
    useEffect(() => {
        const query = getQueryFromUrl()
        if (window.location.pathname === '/post') {
            if(!isNaN(Number(query)) && Number(query) > 0){
                setSearchMode(false);
                setHeadlineMode(false);
                setActiveIndex(-1);
                const fetchPost = async () => {
                    setLoading(true);
                    setError(false)
                    try {
                        const post = await PostService.getPost(query);
                        setPost(prevPost => ({
                            ...prevPost,
                            category: post.category,
                            summary: post.summary,
                            id: post.id ?? null,
                            title: post.title,
                            thumbnail: post.thumbnail,
                            user: post.user,
                            content: processContent(post.content),
                            publishedDate: formatDate(post.publishedDate),
                            lastUpdated: post.lastUpdated ? formatDate(post.lastUpdated) : "",
                        }));
                        setSelectedCategory("")
                        setNotFound(false);
                        fetchTopNews()
                        fetchNews()
                    } catch (error) {
                        if (error.message === "Terjadi kesalahan jaringan") {
                            setError(true)
                        } else if (error.message === "Not found" || error.message === "Bad request") {
                            setNotFound(true);
                        } else {
                            console.log(error)
                        }
                    } finally {
                        setLoading(false)
                    }
                };
                fetchPost();

                return;
            }else {
                setNotFound(true)
            }
        } else if (window.location.pathname === '/search') {
            setSearchQuery(query);
            setActiveIndex(-1);
            setSearchMode(true);
            fetchSearchNews(query);
        }else {
            setSearchMode(false);
            setHeadlineMode(true);
        }

    }, [location.search, newsPage, retry]);



    useEffect(() => {
        if (categories.length === 0) {
            if (window.location.pathname === "/home") {
                handleCategoryChange("home");
                setActiveIndex(0);
                return;
            }
            return;
        }
        if (window.location.pathname !== '/search' && window.location.pathname !== '/post') {
            const primaryCategories = categories.slice(0, 3);
            const remainingCategories = categories.slice(3);

            let foundIndex = primaryCategories.findIndex(cat => cat.name.toLowerCase() === id.toLowerCase());
            console.log(foundIndex);

            if (window.location.pathname === "/home") {
                handleCategoryChange(id);
                setActiveIndex(0);
                return;
            }

            if (foundIndex !== -1) {
                handleCategoryChange(id);
                setActiveIndex(foundIndex + 1);
                return;
            }

            const isInMoreCategories = remainingCategories.some(cat => cat.name.toLowerCase() === id.toLowerCase());
            if (isInMoreCategories) {
                handleCategoryChange(id);
                setActiveIndex(4);
                return;
            }

            setNotFound(true)
        }
    }, [id,categories]);


    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setHeadlinePage(1);
        setTopNewsPage(1);
        setNewsPage(1);

        navigate(`/${category.toLowerCase()}`);
    };

    const primaryCategories = categories.slice(0, 3);
    const remainingCategories = categories.slice(3);

    const allCategories = [
        {label: "Home", command: () => handleCategoryChange("home")},
        ...primaryCategories.map((cat, index) => ({
            label: cat.name,
            command: () => handleCategoryChange(cat.name.toLowerCase()),
        })),
        ...(remainingCategories.length > 0
            ? [{label: "Lainnya", command: (e) => menuRef.current?.toggle(e.originalEvent)}]
            : []),
    ];

    const moreCategories = remainingCategories.map((cat) => ({
        label: cat.name,
        command: () => {
            handleCategoryChange(cat.name.toLowerCase());
            setActiveIndex(4);
        },
    }));

    useEffect(() => {
        const timeout = setTimeout(() => {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        }, 1);  // Delay yang sangat singkat
        return () => clearTimeout(timeout);
    }, [location.search, id]);



    return {
        activeIndex,
        setActiveIndex,
        searchQuery,
        setSearchQuery,
        headlineNews,
        topNews,
        news,
        headlinePage,
        setHeadlinePage,
        topNewsPage,
        setTopNewsPage,
        newsPage,
        setNewsPage,
        headlinePagination,
        topNewsPagination,
        newsPagination,
        menuRef,
        allCategories,
        moreCategories,
        loading,
        error,
        selectedCategory,
        handleCategoryChange,
        topNewsSize,
        headlineSize,
        newsSize,
        headlineMode,
        setHeadlineMode,
        formatDate,
        truncateText,
        post,
        notFound,
        searchMode,
        getQueryFromUrl,
        searchNews,
        searchNewsPage,
        searchNewsPagination,
        searchNewsSize,
        setSearchNewsPage,
        handleRetry,
        categories
    };
};

export default useNews;
