import { appendFile, readdir } from "node:fs/promises"

import { default as tailwindCSS } from "@tailwindcss/vite"
import { default as react } from "@vitejs/plugin-react"
import { default as getDirSize } from "fdir-size"
import { default as prettyBytes } from "pretty-bytes"
import { default as removeAttributes } from "rollup-plugin-jsx-remove-attributes"
import { defineConfig } from "vite"
import { ViteMinifyPlugin as minifyHTML } from "vite-plugin-minify"
import { default as version } from "vite-plugin-package-version"
import { ViteWebfontDownload as webFontDownload } from "vite-plugin-webfont-dl"

export default defineConfig({
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "mantine",
              test: "@mantine"
            },
            {
              name: "react",
              test: "react"
            }
          ]
        }
      }
    }
  },
  plugins: [
    minifyHTML({
      keepClosingSlash: true,
      noNewlinesBeforeTagClose: true,
      removeComments: true
    }),
    react(),
    removeAttributes({
      usage: "vite"
    }),
    tailwindCSS(),
    version(),
    webFontDownload(
      [
        "https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap"
      ],
      {
        assetsSubfolder: "fonts",
        injectAsStyleTag: false,
        subsetsAllowed: [
          "latin"
        ]
      }
    ),
    {
      name: "footer",
      async closeBundle(): Promise<void> {
        await readdir("dist", {
          recursive: true
        })
          .then((files: string[]): string[] =>
            files.filter(
              (file: string): boolean => file.endsWith(".css") || file.endsWith(".html") || file.endsWith(".js")
            )
          )
          .then(async (files: string[]): Promise<void> => {
            for await (const file of files) {
              const cat: string = "♡ ᓚᘏᗢ ♡"
              const footer: string = file.endsWith(".html") ? `<!-- ${cat} -->` : `/* ${cat} */`
              await appendFile(
                `dist/${file}`,
                `${(await Bun.file(`dist/${file}`).text()).endsWith("\n") ? "" : "\n"}${footer}`
              )
            }
          })
      }
    },
    {
      name: "size",
      async closeBundle(): Promise<void> {
        console.info(
          `\nTotal Size: ${prettyBytes(await getDirSize("dist"), {
            maximumFractionDigits: 2
          })}`
        )
      }
    }
  ]
})
