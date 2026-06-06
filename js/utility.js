/*
====================================================
Utility Functions
CDU / VDU Simulator
====================================================
*/

class Utility {

    /*
    ==========================================
    Flash Button Green For 1 Second
    ==========================================
    */

    static flashButton(buttonId) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.classList.remove(
            "button-success"
        );

        /*
        Restart animation
        */

        void btn.offsetWidth;

        btn.classList.add(
            "button-success"
        );

    }

    /*
    ==========================================
    Enable Button
    ==========================================
    */

    static enableButton(buttonId) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.disabled = false;

    }

    /*
    ==========================================
    Disable Button
    ==========================================
    */

    static disableButton(buttonId) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.disabled = true;

    }

    /*
    ==========================================
    Toggle Button
    ==========================================
    */

    static toggleButton(
        buttonId,
        enabled
    ) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.disabled =
        !enabled;

    }

    /*
    ==========================================
    Set Button Text
    ==========================================
    */

    static setButtonText(
        buttonId,
        text
    ) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.textContent =
        text;

    }

    /*
    ==========================================
    Set Loading State
    ==========================================
    */

    static setLoading(
        buttonId,
        loadingText =
        "Processing..."
    ) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.dataset.originalText =
        btn.textContent;

        btn.textContent =
        loadingText;

        btn.disabled =
        true;

    }

    /*
    ==========================================
    Clear Loading State
    ==========================================
    */

    static clearLoading(
        buttonId
    ) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.textContent =
        btn.dataset.originalText ||
        btn.textContent;

        btn.disabled =
        false;

    }

    /*
    ==========================================
    Flash Red (Error)
    ==========================================
    */

    static flashError(
        buttonId
    ) {

        const btn =
        document.getElementById(
            buttonId
        );

        if (!btn) return;

        btn.classList.remove(
            "button-error"
        );

        void btn.offsetWidth;

        btn.classList.add(
            "button-error"
        );

    }

	static bindFlashButton(buttonId){

    const btn =
    document.getElementById(
        buttonId
    );

    if(!btn) return;

    btn.addEventListener(
        "click",
        () => {

            Utility.flashButton(
                buttonId
            );

        }
    );

}

}