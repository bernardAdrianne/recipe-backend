<script lang="ts">
    import { goto } from '$app/navigation';


    function navigateToSignup() {
        goto('/signup');
    }

    let showPassword = false;
    let email = "";
    let password = ""

     async function handleLogin(event: Event) {
        event.preventDefault();

        try {
            const res = await fetch('http://localhost:3000/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                }),
                credentials: 'include'  
            });

            const data = await res.json();

           if (res.ok) {
                goto('/user/dashboard');
            } else {
                throw new Error(data.message || 'Signin failed');
            }
        } catch (err) {
            if (err instanceof Error) {
            console.error('Error:', err.message);
            alert(err.message);
        }
    }
}

</script>
<div class="flex flex-col items-center justify-center h-screen">
    <!-- ReciPinoy Logo-->
    <h1 class="w-28 h-24 mb-4 font-bold text-2xl text-[#115D33]">ReciPinoy</h1> 

    <!-- login form -->
    <form action="" class="w-90 mb-10" on:submit|preventDefault={handleLogin}>
        <div class="flex flex-col gap-2 mb-4">
            <!-- email -->
            <input class="border-1 border-[#EBEBE8] rounded-2xl p-4 w-full text-[#222831] focus:border-[#c6c6c4] focus:text-[#222831] focus:outline-none"
                type="email"
                placeholder="your@email.com"
                bind:value={email}
                required 
                />

            <!-- password -->
            <div class="relative">
                <input class="border-1 border-[#EBEBE8] rounded-2xl p-4 w-full text-[#222831] focus:border-[#c6c6c4] focus:text-[#222831] focus:outline-none"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="password"
                    bind:value={password}
                    required
                    />

                    <button class="absolute inset-y-0 right-3 flex items-center"
                        type="button"
                        on:click={() => showPassword = !showPassword}
                        >
                        <!-- eye icons -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#7D7C78" viewBox="0 0 256 256">
                                <path d="M247.31,124.76c-.35-.79-8.82-19.58-27.65-38.41C194.57,61.26,162.88,48,128,48S61.43,61.26,36.34,86.35C17.51,105.18,9,124,8.69,124.76a8,8,0,0,0,0,6.5c.35.79,8.82,19.57,27.65,38.4C61.43,194.74,93.12,208,128,208s66.57-13.26,91.66-38.34c18.83-18.83,27.3-37.61,27.65-38.4A8,8,0,0,0,247.31,124.76ZM128,192c-30.78,0-57.67-11.19-79.93-33.25A133.47,133.47,0,0,1,25,128,133.33,133.33,0,0,1,48.07,97.25C70.33,75.19,97.22,64,128,64s57.67,11.19,79.93,33.25A133.46,133.46,0,0,1,231.05,128C223.84,141.46,192.43,192,128,192Zm0-112a48,48,0,1,0,48,48A48.05,48.05,0,0,0,128,80Zm0,80a32,32,0,1,1,32-32A32,32,0,0,1,128,160Z"></path>
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#7D7C78" viewBox="0 0 256 256" >
                                <path d="M228,175a8,8,0,0,1-10.92-3l-19-33.2A123.23,123.23,0,0,1,162,155.46l5.87,35.22a8,8,0,0,1-6.58,9.21A8.4,8.4,0,0,1,160,200a8,8,0,0,1-7.88-6.69l-5.77-34.58a133.06,133.06,0,0,1-36.68,0l-5.77,34.58A8,8,0,0,1,96,200a8.4,8.4,0,0,1-1.32-.11,8,8,0,0,1-6.58-9.21L94,155.46a123.23,123.23,0,0,1-36.06-16.69L39,172A8,8,0,1,1,25.06,164l20-35a153.47,153.47,0,0,1-19.3-20A8,8,0,1,1,38.22,99c16.6,20.54,45.64,45,89.78,45s73.18-24.49,89.78-45A8,8,0,1,1,230.22,109a153.47,153.47,0,0,1-19.3,20l20,35A8,8,0,0,1,228,175Z"></path>
                            </svg>
                    </button>
            </div>
        </div>
        <!-- submit button -->
        <button class="bg-[#228B22] text-[#FFFFFF] font-medium text-center text-sm rounded-4xl p-4 w-full cursor-pointer hover:bg-[#00AB41] transition duration-200 ease-in-out"
            type="submit">
            Continue
        </button>
    </form>
    
    <!-- forgot password -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- <p class="text-sm underline font-medium cursor-pointer text-[#37352F]">Forgot Password?</p> -->

    <!-- sign up -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <p class="text-sm text-[#A5A4A1] mt-24">Don't have an account? 
        <span class="text-[#050301] cursor-pointer font-semibold" on:click={navigateToSignup}>Sign Up</span>
    </p>
</div>