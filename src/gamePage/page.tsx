'use client'

import { useState } from "react"

export default function gamePlay () {


    // these i belive will be the ones showing the data coming from the user comments , so like when the data is sent we get them on this side 
    // dont forget o look at the global state management on the gameprovider file in the project 
    const [buttonOneData , setButtonOneData]  = useState('')
    const [buttonTwoData , setButtonTwoData] = useState('')
    const [buttonThreeData , setButtonThreeData] = useState('')
    const [buttonFourData , setButtonFourData] = useState('')

    return (
        <div>
            <h1>STORY FLOW</h1>
            <div>
                {/* lets have some buttons here for the words  */}
                <div className = "w-full ">
                    <div>
                        <button>{buttonOneData}</button>
                        <button>{buttonTwoData}</button>
                    </div>
                    <div>
                        <button>{buttonThreeData}</button>
                        <button>{buttonFourData}</button>
                    </div>
                </div>
            </div>
        </div>
    )
}