'use client'
import { useRouter } from 'next/navigation';

export default function () {

    const confrimCode = (code : number) =>  {
        return true
    }
    
    const code = 1001;

    const handleJoinGame = () => {
        if (confrimCode(code)) {
            router.push('/game');
        }
    }

    <div>
        <div>
            <h1>enter the code to join the game</h1>
            <input type="text" placeholder="Enter Code" className = "text-lg font-bold" />
            <button
            className = ""
            onClick={handleJoinGame}>Join Game</button>
        </div>
    </div>
}