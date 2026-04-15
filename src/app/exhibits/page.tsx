import {client} from '../../lib/sanity'

async function getExhibits() {
  return await client.fetch(`
    *[_type == "exhibitPhoto"]{
      _id,
      title,
      "imageUrl": image.asset->url
    }
  `)
}

export default async function Page() {
  const exhibits = await getExhibits()

  return (
    <main className="p-10 bg-black text-white min-h-screen">
      <h1 className="text-3xl mb-8">Exhibits</h1>

      {exhibits.map((item: any) => (
        <div key={item._id}>
          <img src={item.imageUrl} />
          <p>{item.title}</p>
        </div>
      ))}
    </main>
  )
}