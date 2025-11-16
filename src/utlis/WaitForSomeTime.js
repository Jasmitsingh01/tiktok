export default function WaitForSomeTime(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}