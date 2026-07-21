import DB from ".././Connections/DatabaseCon.js"

const paidWithPriceQuery = {
    is_free: false,
    "rel.coming_soon": { $ne: true },
    "Price.US.final": { $gt: 0 }
}

function formatGame(game) {
    const price = game.Price?.US ? { US: game.Price.US } : {}
    const formatted = {
        ...game,
        Price: price
    }

    return formatted
}

export async function MainPageController(req,res,next) {
  try {
        const { page = 1, filter = "popular" } = req.validatedReq ?? {}
        const limit = 60
        const skip = (page - 1) * limit

        let query = {}
        let sort = {}

        switch (filter) {

            case "free":
                query = { is_free: true }
                sort = { "recs.total": -1 }
            break

            case "paid":
                query = paidWithPriceQuery
                sort = { "recs.total": -1 }
            break

            case "lowest":
                query = paidWithPriceQuery
                sort = { "Price.US.final": 1 }
            break

            case "recent":
                query = {
                    ...paidWithPriceQuery,
                    "rel.date": { $type: "date" }
                }
                sort = { "rel.date": -1 }
            break

            case "popular":

            default:
                query = paidWithPriceQuery
                sort = { "recs.total": -1 }
            break
        }
        const projection = { sdesc: 0, _id: 0, about: 0, lup: 0, is_free: 0, bg: 0, langs: 0, recs: 0, publ: 0, cat: 0, gn: 0, age: 0, plt: 0 }
        const data = await DB.GetData("GamesSch", query, projection, { sort, skip, limit })
        res.status(200).json({ data: data.map(formatGame) })

    } catch (error) { return next(error) }
}

export async function SingleAppDetails(req,res,next) {
  try {
    const steamAppId = Number(req.validatedReq.appid)

    const projection = { _id: 0, lup: 0, about: 0, sdesc: 0, is_free: 0 }
    const [game] = await DB.GetData("GamesSch", { steam_appid: steamAppId }, projection, { limit: 1 })

    if (!game) return res.status(404).json({ error: "Game Not Found" })
    res.status(302).json({ data: formatGame(game) })
  } catch (error) { return next(error) }
}