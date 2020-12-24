<template>
    <div>
        <main>
            <h1 class="form__content_h1" @click="checkHandle">
                WELCOME BACK, <span>CLICK TO CONTUNED..</span>
            </h1>
        </main>
    </div>
</template>

<script>
export default {
    methods: {
        checkHandle() {
            this.$router.push({ name: 'category' })
        }
    }
}
</script>

<style>
body.login {
    all: initial;
    font-family: "Roboto", sans-serif;
    letter-spacing: 0.02em;
}
* {
    box-sizing: border-box;
}
main {
    font-family: "Roboto", sans-serif;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex !important;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    background: #3f2766;
    /* ************* */
    background: #222;
    background-image: repeating-linear-gradient(
        to bottom,
        transparent 7px,
        rgba(0, 0, 0, 0.8) 9px,
        rgba(0, 0, 0, 0.8) 13px,
        transparent 13px
    );
}
h1.form__content_h1 {
    font-size: 40px;
    margin: 15px 0 20px 0;
    letter-spacing: 0.05em;
    color: #714cab;
    font-weight: 700;
    text-shadow: 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500,
        0 0 40px #ffa500, 0 0 60px #ff0000, 0 0 10px #ff8d00, 0 0 98px #ff0000;
    color: #fff6a9;
    animation: blink 5s infinite;
    cursor: pointer;
}
@keyframes blink {
    20%,
    24%,
    55% {
        color: #111;
        text-shadow: none;
    }

    0%,
    19%,
    21%,
    23%,
    25%,
    54%,
    56%,
    100% {
        text-shadow: 0 0 5px #ffa500, 0 0 15px #ffa500, 0 0 20px #ffa500,
            0 0 40px #ffa500, 0 0 60px #ff0000, 0 0 10px #ff8d00,
            0 0 98px #ff0000;
        color: #fff6a9;
    }
}
</style>