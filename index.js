export default async (req, res) => {
    return res.send(
        <button onClick={() => alert("Click")}>Click</button>
    );
}