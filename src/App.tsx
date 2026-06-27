import { HashRouter, Routes, Route } from "react-router-dom";
import Gate from "./auth/Gate";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import Counters from "./pages/Counters";
import ImportantDates from "./pages/ImportantDates";
import DateIdeas from "./pages/DateIdeas";
import RomCom from "./pages/RomCom";

import Lobby from "./pages/games/Lobby";
import Connect4Page from "./pages/games/Connect4Page";
import BattleshipPage from "./pages/games/BattleshipPage";
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
            <Route path="games/heart" element={<HeartPage />} />
            <Route path="games/phrase" element={<PhrasePage />} />

            <Route path="dates" element={<DateIdeas />} />
            <Route path="romcom" element={<RomCom />} />
          </Route>
        </Routes>
      </HashRouter>
    </Gate>
  );
}
