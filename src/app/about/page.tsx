import {client} from '../../lib/sanity'

async function getBio() {
  return await client.fetch(`
    *[_type == "artistBio"][0]{
      name,
      bio
    }
  `)
}

export default async function Page() {
  const bio = await getBio()

  return (
    <main className="p-10 bg-black text-white min-h-screen">
      <h1 className="text-3xl mb-4">{bio?.name}</h1>
      <p>{bio?.bio}</p>
    </main>
  )
}