import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {animationType} from './src/sanity/schemaTypes/animation'
import {artistBioType} from './src/sanity/schemaTypes/artistBio'
import {exhibitPhotoType} from './src/sanity/schemaTypes/exhibitPhoto'
import {illustrationType} from './src/sanity/schemaTypes/illustration'

export default defineConfig({
  name: 'default',
  title: 'Ryan Portfolio',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  basePath: '/studio',
  plugins: [structureTool()],
  schema: {
    types: [
      illustrationType,
      animationType,
      exhibitPhotoType,
      artistBioType,
    ],
  },
})