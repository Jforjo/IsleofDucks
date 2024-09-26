export default async (req, res) => {
    return res.send({ message: 
        <button onClick={() => alert("Click")}>Click</button>
     });
}