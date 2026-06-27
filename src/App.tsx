import { HashRouter, Routes, Route } from "react-router-dom";
import Gate from "./auth/Gate";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Counters from "./pages/Counters";
import ImportantDates from "./pages/ImportantDates";
import LoveNotes from "./pages/LoveNotes";
import Timeline from "./pages/Timeline";
import DateIdeas from "./pages/DateIdeas";
import Reasons from "./pages/Reasons";
import RomCom from "./pages/RomCom";
import Chat from "./pages/Chat";

import Lobby from "./pages/games/Lobby";
import Connect4Page from "./pages/games/Connect4Page";
import BattleshipPage from "./pages/games/BattleshipPage";
import SnakesPage from "./pages/games/SnakesPage";
import LudoPage from "./pages/games/LudoPage";
import HeartPage from "./pages/games/HeartPage";
import PhrasePage from "./pages/games/PhrasePage";

export default function App() {
  return (
    <Gate>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="calendar" element={<Counters />} />
            <Route path="calendar/dates" element={<ImportantDates />} />

            <Route path="games" element={<Lobby />} />
            <Route path="games/connect4" element={<Connect4Page />} />
            <Route path="games/battleship" element={<BattleshipPage />} />
            <Route path="games/snakes" element={<SnakesPage />} />
            <Route path="games/ludo" element={<LudoPage />} />
            <Route path="games/heart" element={<HeartPage />} />
            <Route path="games/phrase" element={<PhrasePage />} />

            <Route path="notes" element={<LoveNotes />} />
            <Route path="timeline" element={<Timeline />} />
            <Route path="dates" element={<DateIdeas />} />
            <Route path="reasons" element={<Reasons />} />
            <Route path="romcom" element={<RomCom />} />
            <Route path="chat" element={<Chat />} />
          </Route>
        </Routes>
      </HashRouter>
    </Gate>
  );
}
